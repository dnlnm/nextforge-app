"use server";

import { randomBytes } from "node:crypto";
import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { buildWorkspaceUrl } from "@repo/auth/domain";
import { database, type Prisma } from "@repo/database";
import { sendTeacherInvitation } from "@repo/email/teacher-invite";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const formatCode = (prefix: string, sequence: number) =>
  `${prefix}${String(sequence).padStart(4, "0")}`;

export const getNextTeacherCode = async () => {
  const tenant = await requireTenant();
  const count = await database.teacherProfile.count({
    where: { organizationId: tenant.organizationId },
  });

  return formatCode("TCH", count + 1);
};

export const createTeacher = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const fullName = getString(formData, "fullName");

  if (!fullName) {
    throw new Error("Teacher name is required.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "teachers",
    userId: tenant.authUserId,
  });

  const count = await database.teacherProfile.count({
    where: { organizationId: tenant.organizationId },
  });

  await database.teacherProfile.create({
    data: {
      organizationId: tenant.organizationId,
      email: getString(formData, "email"),
      fullName,
      code: formatCode("TCH", count + 1),
      phone: getString(formData, "phone"),
      notes: getString(formData, "notes"),
    },
  });

  revalidatePath("/teachers");
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

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

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
      Math.ceil(
        (invitation.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
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

  const [teachers, totalCount] = await Promise.all([
    database.teacherProfile.findMany({
      where,
      orderBy: { fullName: "asc" },
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

export async function getTeacherFilterOptions() {
  const tenant = await requireTenant();

  const [subjects, branches] = await Promise.all([
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    database.branch.findMany({
      where: { organizationId: tenant.organizationId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    branches: branches.map((branch) => ({
      label: branch.name,
      value: branch.name,
    })),
    statuses: [{ label: "Active", value: "ACTIVE" }],
    subjects: subjects.map((subject) => ({
      label: subject.name,
      value: subject.name,
    })),
  };
}
