"use server";

import { randomBytes } from "node:crypto";
import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { buildWorkspaceUrl } from "@repo/auth/domain";
import { database, type Prisma } from "@repo/database";
import {
  addMalaysiaCalendarDays,
  differenceInMalaysiaCalendarDays,
} from "@repo/date";
import { sendTeacherInvitation } from "@repo/email/teacher-invite";
import { parseMoneyToSen } from "@repo/money";
import {
  type Gender,
  genders,
  type TeacherEmploymentType,
  teacherEmploymentTypes,
} from "@repo/schemas/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const genderSet = new Set<string>(genders);
const employmentTypeSet = new Set<string>(teacherEmploymentTypes);

const formatCode = (prefix: string, sequence: number) =>
  `${prefix}${String(sequence).padStart(4, "0")}`;

export const getNextTeacherCode = async () => {
  const tenant = await requireTenant();
  const count = await database.teacherProfile.count({
    where: { organizationId: tenant.organizationId },
  });

  return formatCode("TCH", count + 1);
};

export const createTeacher = async (
  formData: FormData
): Promise<{ error?: string }> => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const parsed = parseTeacherCreateInput(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { email, fullName, sendInvite, data } = parsed.fields;

  if (sendInvite) {
    const existingInvite = await database.teacherInvitation.findFirst({
      where: {
        organizationId: tenant.organizationId,
        email,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingInvite) {
      return { error: "A teacher with this email has already been invited." };
    }
  }

  try {
    await assertWithinPlanLimit({
      organizationId: tenant.organizationId,
      resource: "teachers",
      userId: tenant.authUserId,
    });
  } catch {
    return { error: "Teacher limit reached for your plan." };
  }

  const count = await database.teacherProfile.count({
    where: { organizationId: tenant.organizationId },
  });

  const created = await database.teacherProfile.create({
    data: {
      ...data,
      organizationId: tenant.organizationId,
      code: formatCode("TCH", count + 1),
    },
    select: { id: true },
  });

  if (sendInvite) {
    await createInvitationAndNotify(tenant, email, fullName);
  }

  revalidatePath("/teachers");
  redirect(`/teachers/${created.id}`);
};

interface ParsedTeacherFields {
  data: Omit<
    Prisma.TeacherProfileUncheckedCreateInput,
    "code" | "organizationId"
  >;
  email: string;
  fullName: string;
  sendInvite: boolean;
}

const parseTeacherCreateInput = (
  formData: FormData
): { error: string } | { fields: ParsedTeacherFields } => {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    getString(formData, "fullName");
  const email = parseEmail(getString(formData, "email"));
  const phone = getString(formData, "phone");

  if (!fullName) {
    return { error: "Teacher name is required." };
  }

  if (!email) {
    return { error: "A valid email address is required." };
  }

  if (!phone) {
    return { error: "Phone number is required." };
  }

  const gender = getString(formData, "gender");
  const employmentType = getString(formData, "employmentType");
  const salarySen = parseMoneyToSen(getString(formData, "salary"));
  const hourlyRateSen = parseMoneyToSen(getString(formData, "hourlyRate"));

  if (getString(formData, "salary") && salarySen === undefined) {
    return { error: "Enter a valid monthly salary." };
  }

  if (getString(formData, "hourlyRate") && hourlyRateSen === undefined) {
    return { error: "Enter a valid hourly rate." };
  }

  return {
    fields: {
      data: {
        email,
        fullName,
        gender:
          gender && genderSet.has(gender) ? (gender as Gender) : undefined,
        qualification: getString(formData, "qualification"),
        salarySen,
        hourlyRateSen,
        photoKey: getString(formData, "photoKey"),
        icNumber: getString(formData, "icNumber"),
        employmentType:
          employmentType && employmentTypeSet.has(employmentType)
            ? (employmentType as TeacherEmploymentType)
            : undefined,
        phone,
        notes: getString(formData, "notes"),
      },
      email,
      fullName,
      sendInvite: getString(formData, "sendInvite") === "on",
    },
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmail = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return EMAIL_PATTERN.test(normalized) ? normalized : undefined;
};

const INVITATION_TTL_DAYS = 7;

interface TenantContext {
  readonly organizationId: string;
  readonly userId: string;
}

const createInvitationAndNotify = async (
  tenant: TenantContext,
  email: string,
  fullName: string
) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = addMalaysiaCalendarDays(new Date(), INVITATION_TTL_DAYS);

  const [organization, reusableInvitation] = await Promise.all([
    database.organization.findFirst({
      where: { id: tenant.organizationId },
      select: { name: true, slug: true },
    }),
    database.teacherInvitation.findFirst({
      where: {
        organizationId: tenant.organizationId,
        email,
        status: { in: ["REVOKED", "EXPIRED"] },
      },
      select: { id: true },
    }),
  ]);

  const invitation = reusableInvitation
    ? await database.teacherInvitation.update({
        where: { id: reusableInvitation.id },
        data: {
          fullName,
          token,
          expiresAt,
          invitedByUserId: tenant.userId,
          status: "PENDING",
          acceptedByUserId: null,
          acceptedAt: null,
          revokedAt: null,
        },
        select: { token: true },
      })
    : await database.teacherInvitation.create({
        data: {
          organizationId: tenant.organizationId,
          email,
          fullName,
          token,
          expiresAt,
          invitedByUserId: tenant.userId,
        },
        select: { token: true },
      });

  const actionUrl = organization?.slug
    ? buildWorkspaceUrl(
        organization.slug,
        `/invite/accept?token=${invitation.token}`
      )
    : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/accept?token=${invitation.token}`;

  await sendTeacherInvitation({
    actionUrl,
    inviteeEmail: email,
    inviteeName: fullName,
    organizationName: organization?.name ?? "your centre",
  });
};

export const inviteTeacher = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const fullName = getString(formData, "fullName");
  const email = parseEmail(getString(formData, "email"));

  if (!fullName) {
    throw new Error("Teacher name is required.");
  }

  if (!email) {
    throw new Error("A valid email address is required.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "teachers",
    userId: tenant.authUserId,
  });

  const existing = await database.teacherInvitation.findFirst({
    where: { organizationId: tenant.organizationId, email, status: "PENDING" },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A teacher with this email has already been invited.");
  }

  await createInvitationAndNotify(tenant, email, fullName);

  revalidatePath("/teachers");
};

export const revokeInvitation = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const invitationId = getString(formData, "invitationId");

  if (!invitationId) {
    throw new Error("Invitation is required.");
  }

  const invitation = await database.teacherInvitation.findFirst({
    where: { id: invitationId, organizationId: tenant.organizationId },
    select: { email: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  await database.teacherInvitation.deleteMany({
    where: {
      organizationId: tenant.organizationId,
      email: invitation.email,
      status: { in: ["REVOKED", "EXPIRED"] },
    },
  });

  await database.teacherInvitation.updateMany({
    where: {
      id: invitationId,
      organizationId: tenant.organizationId,
      status: "PENDING",
    },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  revalidatePath("/teachers");
};

export const getPendingInvitations = async () => {
  const tenant = await requireTenant();

  const now = new Date();
  // Remove any stale EXPIRED rows for these emails first so the unique
  // (organizationId, email, status) constraint is not violated when
  // PENDING invitations transition to EXPIRED below.
  const expiring = await database.teacherInvitation.findMany({
    where: {
      organizationId: tenant.organizationId,
      status: "PENDING",
      expiresAt: { lte: now },
    },
    select: { email: true },
  });
  const expiringEmails = Array.from(
    new Set(expiring.map((invitation) => invitation.email))
  );

  if (expiringEmails.length > 0) {
    await database.teacherInvitation.deleteMany({
      where: {
        organizationId: tenant.organizationId,
        email: { in: expiringEmails },
        status: "EXPIRED",
      },
    });
  }

  await database.teacherInvitation.updateMany({
    where: {
      organizationId: tenant.organizationId,
      status: "PENDING",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const invitations = await database.teacherInvitation.findMany({
    where: { organizationId: tenant.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      email: true,
      expiresAt: true,
      fullName: true,
      id: true,
    },
  });

  return invitations.map((invitation) => ({
    ...invitation,
    expiresInDays: Math.max(
      0,
      differenceInMalaysiaCalendarDays(invitation.expiresAt, now)
    ),
  }));
};

export const archiveTeacher = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const teacherId = getString(formData, "teacherId");

  if (!teacherId) {
    throw new Error("Teacher is required.");
  }

  await database.teacherProfile.updateMany({
    where: { id: teacherId, organizationId: tenant.organizationId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/teachers");
};

export interface TeachersQueryParams {
  filters?: Array<{ id: string; value: unknown }>;
  page: number;
  pageSize: number;
  search?: string;
  sorting?: Array<{ id: string; desc: boolean }>;
}

const applyTeacherFilters = (
  where: Prisma.TeacherProfileWhereInput,
  filters: Array<{ id: string; value: unknown }>
) => {
  for (const filter of filters) {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];

    if (values.length === 0) {
      continue;
    }

    switch (filter.id) {
      case "subject":
        where.classes = {
          some: {
            archivedAt: null,
            subject: { name: { in: values as string[] } },
          },
        };
        break;
      case "branch":
        where.branch = { name: { in: values as string[] } };
        break;
      default:
        break;
    }
  }
};

export async function getTeachersForTable(params: TeachersQueryParams) {
  const tenant = await requireTenant();

  const where: Prisma.TeacherProfileWhereInput = {
    organizationId: tenant.organizationId,
    archivedAt: null,
  };

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.filters && params.filters.length > 0) {
    applyTeacherFilters(where, params.filters);
  }

  const orderBy: Prisma.TeacherProfileOrderByWithRelationInput[] = [];
  if (params.sorting && params.sorting.length > 0) {
    for (const sort of params.sorting) {
      switch (sort.id) {
        case "fullName":
          orderBy.push({ fullName: sort.desc ? "desc" : "asc" });
          break;
        case "branch":
          orderBy.push({ branch: { name: sort.desc ? "desc" : "asc" } });
          break;
        default:
          break;
      }
    }
  } else {
    orderBy.push({ fullName: "asc" });
  }

  const [teachers, totalCount] = await Promise.all([
    database.teacherProfile.findMany({
      where,
      orderBy,
      skip: params.page * params.pageSize,
      take: params.pageSize,
      include: {
        branch: true,
        classes: {
          where: { archivedAt: null },
          include: {
            subject: true,
            enrollments: {
              where: { archivedAt: null, status: "ACTIVE" },
              select: { id: true },
            },
          },
        },
      },
    }),
    database.teacherProfile.count({ where }),
  ]);

  return {
    data: teachers.map((teacher) => ({
      branchName: teacher.branch?.name ?? null,
      classCount: teacher.classes.length,
      code: teacher.code,
      email: teacher.email,
      fullName: teacher.fullName,
      id: teacher.id,
      phone: teacher.phone,
      status: "ACTIVE",
      subjects: Array.from(
        new Set(
          teacher.classes.map((learningClass) => learningClass.subject.name)
        )
      ),
    })),
    totalCount,
  };
}
