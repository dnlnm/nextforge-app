import { database, type Prisma } from "@repo/database";
import { type StudentStatus, studentStatuses } from "@repo/schemas/enums";
import { studentsQueryParamsSchema } from "@repo/schemas/students";
import { orgProcedure } from "../middleware";
import { createTRPCRouter } from "../trpc";

const statuses = new Set<StudentStatus>(studentStatuses);

const asStringArray = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : [value];

  return values.filter((v): v is string => typeof v === "string");
};

const applyStatusFilter = (where: Prisma.StudentWhereInput, value: unknown) => {
  const validStatuses = asStringArray(value).filter((v): v is StudentStatus =>
    statuses.has(v as StudentStatus)
  );

  if (validStatuses.length === 0) {
    return;
  }

  where.status = { in: validStatuses };
  const hasArchived = validStatuses.includes("ARCHIVED");
  const hasActive = validStatuses.includes("ACTIVE");

  if (hasArchived && hasActive) {
    where.archivedAt = undefined;
  } else if (hasArchived) {
    where.archivedAt = { not: null };
  } else {
    where.archivedAt = null;
  }
};

const applyClassFilter = (where: Prisma.StudentWhereInput, value: unknown) => {
  const values = asStringArray(value);

  if (values.length === 0) {
    return;
  }

  where.enrollments = {
    some: {
      classId: { in: values },
      status: "ACTIVE",
      archivedAt: null,
    },
  };
};

const applyTutorFilter = (where: Prisma.StudentWhereInput, value: unknown) => {
  const values = asStringArray(value);

  if (values.length === 0) {
    return;
  }

  where.enrollments = {
    some: {
      class: {
        teacherId: { in: values },
      },
      status: "ACTIVE",
      archivedAt: null,
    },
  };
};

const applyLevelFilter = (where: Prisma.StudentWhereInput, value: unknown) => {
  const values = asStringArray(value);

  if (values.length === 0) {
    return;
  }

  where.level = { name: { in: values } };
};

const applyFilter = (
  where: Prisma.StudentWhereInput,
  filter: { id: string; value: unknown }
) => {
  switch (filter.id) {
    case "status":
      applyStatusFilter(where, filter.value);
      break;
    case "class":
      applyClassFilter(where, filter.value);
      break;
    case "tutor":
      applyTutorFilter(where, filter.value);
      break;
    case "academicLevel":
      applyLevelFilter(where, filter.value);
      break;
    default:
      break;
  }
};

const buildOrderBy = (
  sorting: Array<{ desc: boolean; id: string }> | undefined
): Prisma.StudentOrderByWithRelationInput[] => {
  if (!sorting || sorting.length === 0) {
    return [{ fullName: "asc" }];
  }

  const orderBy: Prisma.StudentOrderByWithRelationInput[] = [];

  for (const sort of sorting) {
    switch (sort.id) {
      case "fullName":
        orderBy.push({ fullName: sort.desc ? "desc" : "asc" });
        break;
      case "status":
        orderBy.push({ status: sort.desc ? "desc" : "asc" });
        break;
      case "academicLevel":
        orderBy.push({
          level: { name: sort.desc ? "desc" : "asc" },
        });
        break;
      default:
        break;
    }
  }

  return orderBy.length > 0 ? orderBy : [{ fullName: "asc" }];
};

export const studentsRouter = createTRPCRouter({
  list: orgProcedure
    .input(studentsQueryParamsSchema)
    .query(async ({ ctx, input }) => {
      const where: Prisma.StudentWhereInput = {
        organizationId: ctx.organizationId,
        archivedAt: null,
      };

      if (input.search) {
        where.OR = [
          { fullName: { contains: input.search, mode: "insensitive" } },
          { preferredName: { contains: input.search, mode: "insensitive" } },
          { schoolName: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.filters && input.filters.length > 0) {
        for (const filter of input.filters) {
          applyFilter(where, filter);
        }
      }

      const orderBy = buildOrderBy(input.sorting);

      const [students, totalCount] = await Promise.all([
        database.student.findMany({
          where,
          orderBy,
          skip: input.page * input.pageSize,
          take: input.pageSize,
          include: {
            branch: true,
            level: true,
            enrollments: {
              where: { status: "ACTIVE", archivedAt: null },
              include: {
                class: {
                  include: {
                    subject: true,
                    teacher: true,
                  },
                },
              },
            },
            guardians: {
              where: { isPrimary: true },
              include: { guardian: true },
              take: 1,
            },
          },
        }),
        database.student.count({ where }),
      ]);

      return { data: students, totalCount };
    }),

  filterOptions: orgProcedure.query(async ({ ctx }) => {
    const [classes, teachers, levels] = await Promise.all([
      database.learningClass.findMany({
        where: { organizationId: ctx.organizationId, archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      database.teacherProfile.findMany({
        where: { organizationId: ctx.organizationId, archivedAt: null },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
      database.level.findMany({
        where: { organizationId: ctx.organizationId, archivedAt: null },
        select: { id: true, name: true, order: true },
        orderBy: { order: "asc" },
      }),
    ]);

    return {
      classes: classes.map((c) => ({ label: c.name, value: c.id })),
      levels: levels.map((l) => ({ label: l.name, value: l.name })),
      tutors: teachers.map((t) => ({ label: t.fullName, value: t.id })),
      statuses: [
        { label: "Active", value: "ACTIVE" },
        { label: "Archived", value: "ARCHIVED" },
      ],
    };
  }),
});
