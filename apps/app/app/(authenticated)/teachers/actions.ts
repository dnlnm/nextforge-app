"use server";

import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { database, type Prisma } from "@repo/database";
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
