import { isPlatformAdminUserId } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  activeSubscriptionStatuses,
  type PlanDefinition,
  planDefinitions,
} from "@repo/payments/plans";

export type LimitResource =
  | "classes"
  | "invoicesPerMonth"
  | "students"
  | "teachers";

export const getOrCreateSubscription = (organizationId: string) => {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  return database.organizationSubscription.upsert({
    where: { organizationId },
    create: { organizationId, trialEndsAt },
    update: {},
  });
};

export const getSubscriptionUsage = async (organizationId: string) => {
  const now = new Date();
  const billingMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const [students, teachers, pendingTeacherInvites, classes, invoicesPerMonth] =
    await Promise.all([
      database.student.count({
        where: { organizationId, archivedAt: null, status: "ACTIVE" },
      }),
      database.teacherProfile.count({
        where: { organizationId, archivedAt: null },
      }),
      database.teacherInvitation.count({
        where: { organizationId, status: "PENDING", expiresAt: { gt: now } },
      }),
      database.learningClass.count({
        where: { organizationId, archivedAt: null, status: "ACTIVE" },
      }),
      database.invoice.count({ where: { organizationId, billingMonth } }),
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
    Boolean(subscription.trialEndsAt && subscription.trialEndsAt < now);
  const canUsePaidFeatures =
    activeSubscriptionStatuses.has(subscription.status) && !trialExpired;

  return { canUsePaidFeatures, plan, subscription, trialExpired, usage };
};

export const assertWithinPlanLimit = async ({
  increment = 1,
  organizationId,
  resource,
  userId,
}: {
  readonly increment?: number;
  readonly organizationId: string;
  readonly resource: LimitResource;
  readonly userId: string;
}) => {
  if (isPlatformAdminUserId(userId)) {
    return;
  }

  const state = await getBillingState(organizationId);

  if (!state.canUsePaidFeatures) {
    throw new Error(
      "Your TLAS.MY trial or subscription is not active. Open Billing to upgrade or manage your plan."
    );
  }

  const current = state.usage[resource];
  const limit = state.plan[resource];

  if (current + increment > limit) {
    throw new Error(
      `${state.plan.name} allows ${limit} ${resource}. Open Billing to upgrade your plan.`
    );
  }
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
