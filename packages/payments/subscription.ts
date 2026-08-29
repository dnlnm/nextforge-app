import { isSuperadminUserId } from "@repo/auth/shared";
import { appName } from "@repo/config/brand";
import { database, type Prisma, type SubscriptionPlan } from "@repo/database";
import {
  addMalaysiaCalendarDays,
  getMalaysiaCalendarDate,
  isExpired,
} from "@repo/date";
import {
  activeSubscriptionStatuses,
  type PlanDefinition,
  planDefinitions,
} from "./plans";

export type LimitResource =
  | "classes"
  | "invoicesPerMonth"
  | "students"
  | "teachers";

/**
 * The subset of the Prisma client / transaction client that usage counting
 * needs. Both the base `PrismaClient` and a `Prisma.TransactionClient` are
 * structurally compatible, so counting can happen against either.
 */
export type UsageClient = {
  invoice: {
    count(args: Prisma.InvoiceCountArgs): Promise<number>;
  };
  learningClass: {
    count(args: Prisma.LearningClassCountArgs): Promise<number>;
  };
  student: {
    count(args: Prisma.StudentCountArgs): Promise<number>;
  };
  teacherInvitation: {
    count(args: Prisma.TeacherInvitationCountArgs): Promise<number>;
  };
  teacherProfile: {
    count(args: Prisma.TeacherProfileCountArgs): Promise<number>;
  };
};

export const getOrCreateSubscription = (organizationId: string) => {
  const trialEndsAt = addMalaysiaCalendarDays(new Date(), 14);

  return database.organizationSubscription.upsert({
    where: { organizationId },
    create: { organizationId, trialEndsAt },
    update: {},
  });
};

export const getSubscriptionUsage = async (
  organizationId: string,
  client: UsageClient = database
) => {
  // The billing-month key is the Asia/Kuala_Lumpur calendar month (per
  // AGENTS.md), not the server/UTC month, so plan-cap accounting and labels
  // agree with Malaysian business days around midnight.
  const billingMonth = getMalaysiaCalendarDate().slice(0, 7);
  const now = new Date();

  const [students, teachers, pendingTeacherInvites, classes, invoicesPerMonth] =
    await Promise.all([
      client.student.count({
        where: { organizationId, archivedAt: null, status: "ACTIVE" },
      }),
      client.teacherProfile.count({
        where: { organizationId, archivedAt: null },
      }),
      client.teacherInvitation.count({
        where: { organizationId, status: "PENDING", expiresAt: { gt: now } },
      }),
      client.learningClass.count({
        where: { organizationId, archivedAt: null, status: "ACTIVE" },
      }),
      client.invoice.count({ where: { organizationId, billingMonth } }),
    ]);

  return {
    billingMonth,
    classes,
    invoicesPerMonth,
    students,
    teachers: teachers + pendingTeacherInvites,
  };
};

export const getBillingState = async (organizationId: string) => {
  const [subscription, usage] = await Promise.all([
    getOrCreateSubscription(organizationId),
    getSubscriptionUsage(organizationId),
  ]);
  const plan = planDefinitions[subscription.plan];
  const now = new Date();
  const trialExpired =
    subscription.status === "TRIALING" &&
    Boolean(
      subscription.trialEndsAt && isExpired(subscription.trialEndsAt, now)
    );
  const canUsePaidFeatures =
    activeSubscriptionStatuses.has(subscription.status) && !trialExpired;

  return { canUsePaidFeatures, plan, subscription, trialExpired, usage };
};

interface PlanLimitCheck {
  readonly increment: number;
  readonly organizationId: string;
  readonly resource: LimitResource;
  readonly userId: string;
}

const throwOutOfLimitOrInactive = (
  resource: LimitResource,
  planName: string,
  limit: number
): never => {
  throw new Error(
    `${planName} allows ${limit} ${resource}. Open Billing to upgrade your plan.`
  );
};

const assertPlanLimit = (
  check: PlanLimitCheck,
  {
    canUsePaidFeatures,
    limit,
    planName,
    usage,
  }: {
    canUsePaidFeatures: boolean;
    limit: number;
    planName: string;
    usage: number;
  }
) => {
  if (!canUsePaidFeatures) {
    throw new Error(
      `Your ${appName} trial or subscription is not active. Open Billing to upgrade or manage your plan.`
    );
  }

  if (usage + check.increment > limit) {
    throwOutOfLimitOrInactive(check.resource, planName, limit);
  }
};

type AssertWithinPlanLimitArgs = {
  readonly increment?: number;
  readonly organizationId: string;
  readonly resource: LimitResource;
  readonly userId: string;
};

export const assertWithinPlanLimit = async (input: AssertWithinPlanLimitArgs) => {
  if (isSuperadminUserId(input.userId)) {
    return;
  }

  const state = await getBillingState(input.organizationId);

  assertPlanLimit(
    { ...input, increment: input.increment ?? 1 },
    {
      canUsePaidFeatures: state.canUsePaidFeatures,
      limit: state.plan[input.resource],
      planName: state.plan.name,
      usage: state.usage[input.resource],
    }
  );
};

/**
 * Transaction-scoped plan-limit check. Re-counts current usage and re-derives
 * the plan *inside the same transaction* as the resource create so the check
 * and the write commit (or roll back) together. This makes the limit a hard
 * invariant for writes that wrap their create in a `$transaction`: the plan
 * / usage cannot silently change between the check and the write the way a
 * separate `assertWithinPlanLimit` + later `create` can.
 *
 * Note on concurrency: under Postgres `Read Committed` two *fully concurrent*
 * creates of the same resource can still both observe a count below the limit
 * and both pass. Combine this with a unique constraint / atomic counter on the
 * resource to close that residual window; this helper removes the far more
 * common check-then-act window where the create is a separate transaction.
 */
export const assertWithinPlanLimitTx = async (
  tx: Prisma.TransactionClient,
  input: AssertWithinPlanLimitArgs
) => {
  if (isSuperadminUserId(input.userId)) {
    return;
  }

  const { increment = 1, organizationId, resource } = input;

  // Read the subscription directly from the transaction (no upsert) so the
  // check does not write on the read path.
  const subscription = await tx.organizationSubscription.findUnique({
    where: { organizationId },
  });

  const now = new Date();
  const trialExpired =
    subscription?.status === "TRIALING" &&
    Boolean(
      subscription.trialEndsAt && isExpired(subscription.trialEndsAt, now)
    );
  const canUsePaidFeatures =
    activeSubscriptionStatuses.has(subscription?.status ?? "TRIALING") &&
    !trialExpired;
  const plan = planDefinitions[subscription?.plan ?? "STARTER"];
  const usage = await getSubscriptionUsage(organizationId, tx);

  assertPlanLimit(
    { increment, organizationId, resource, userId: input.userId },
    {
      canUsePaidFeatures,
      limit: plan[resource],
      planName: plan.name,
      usage: usage[resource],
    }
  );
};

export const getPlanUsageRows = (
  plan: PlanDefinition,
  usage: Awaited<ReturnType<typeof getSubscriptionUsage>>
) => [
  { label: "Students", limit: plan.students, value: usage.students },
  { label: "Teachers", limit: plan.teachers, value: usage.teachers },
  { label: "Classes", limit: plan.classes, value: usage.classes },
  {
    label: `Invoices in ${usage.billingMonth}`,
    limit: plan.invoicesPerMonth,
    value: usage.invoicesPerMonth,
  },
];

const adminPlanLimits: Record<SubscriptionPlan, number | null> = {
  STARTER: 1,
  PRO: 5,
  MAX: 10,
};

export const assertAdminWithinPlanLimit = async ({
  organizationId,
  userId,
}: {
  readonly organizationId: string;
  readonly userId: string;
}) => {
  if (isSuperadminUserId(userId)) {
    return;
  }

  const state = await getBillingState(organizationId);

  if (!state.canUsePaidFeatures) {
    throw new Error(
      `Your ${appName} trial or subscription is not active. Open Billing to upgrade or manage your plan.`
    );
  }

  const limit = adminPlanLimits[state.subscription.plan];

  if (limit === null) {
    return;
  }

  const now = new Date();
  const [activeAdmins, pendingInvitations] = await Promise.all([
    database.organizationMembership.count({
      where: {
        organizationId,
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
    database.adminInvitation.count({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
    }),
  ]);

  const total = activeAdmins + pendingInvitations;

  if (total >= limit) {
    throw new Error(
      `${state.plan.name} allows ${limit} admin${limit === 1 ? "" : "s"}. Open Billing to upgrade your plan.`
    );
  }
};
