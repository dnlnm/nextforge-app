import { database, type Prisma } from "@repo/database";
import { parseCalendarDate } from "@repo/date";
import { type StudentStatus, studentStatuses } from "@repo/schemas/enums";
import {
  createStudentInputSchema,
  studentIdInputSchema,
  studentsQueryParamsSchema,
  updateStudentInputSchema,
} from "@repo/schemas/students";
import { getTeacherProfileId } from "../lib/teacher-profile";
import {
  assertWithinPlanLimit,
  orgProcedure,
  roleProcedure,
} from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

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

      // Teachers only see students in the classes they teach (spec §5).
      const teacherProfileId = await getTeacherProfileId(ctx);

      if (teacherProfileId !== undefined) {
        where.enrollments = {
          some: {
            status: "ACTIVE",
            archivedAt: null,
            class: {
              teacherId: teacherProfileId,
            },
          },
        };
      }

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

  getNextStudentCode: orgProcedure.query(async ({ ctx }) => {
    const organization = await database.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { studentCodeSequence: true },
    });
    return `STU${String(organization.studentCodeSequence + 1).padStart(4, "0")}`;
  }),

  create: roleProcedure(["ADMIN"])
    .input(createStudentInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertWithinPlanLimit(ctx, "students");

      const levelId =
        input.levelId === "none" || input.levelId === undefined
          ? null
          : input.levelId;

      const address = {
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
      };

      const student = await database.$transaction(async (tx) => {
        const organization = await tx.organization.update({
          where: { id: ctx.organizationId },
          data: { studentCodeSequence: { increment: 1 } },
          select: { studentCodeSequence: true },
        });
        const code = `STU${String(organization.studentCodeSequence).padStart(4, "0")}`;

        const created = await tx.student.create({
          data: {
            organizationId: ctx.organizationId,
            fullName: input.fullName,
            code,
            levelId,
            dateOfBirth: input.dateOfBirth
              ? parseCalendarDate(input.dateOfBirth)
              : undefined,
            enrolledAt: input.enrolledAt
              ? parseCalendarDate(input.enrolledAt)
              : new Date(),
            gender: input.gender,
            phone: input.studentPhone,
            email: input.studentEmail,
            ...address,
            city: input.city,
            state: input.state,
            postcode: input.postcode,
            preferredName: input.preferredName,
            schoolName: input.schoolName,
            photoKey: input.photoKey,
            notes: input.notes,
          },
          select: { id: true },
        });

        const guardianAddress = input.sameAsStudentAddress
          ? address
          : {
              addressLine1: input.guardianAddressLine1,
              addressLine2: input.guardianAddressLine2,
            };

        const guardian = await tx.guardian.create({
          data: {
            organizationId: ctx.organizationId,
            email: input.guardianEmail,
            fullName: input.guardianName,
            phone: input.guardianPhone,
            ...guardianAddress,
            city: input.sameAsStudentAddress ? input.city : undefined,
            state: input.sameAsStudentAddress ? input.state : undefined,
            postcode: input.sameAsStudentAddress ? input.postcode : undefined,
          },
          select: { id: true },
        });

        await tx.studentGuardian.create({
          data: {
            guardianId: guardian.id,
            isPrimary: true,
            receivesBilling: true,
            relationship: input.relationship ?? "GUARDIAN",
            studentId: created.id,
          },
        });

        return created;
      });

      return { studentId: student.id };
    }),

  update: roleProcedure(["ADMIN"])
    .input(updateStudentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const levelId =
        input.levelId === "none" || input.levelId === undefined
          ? null
          : input.levelId;

      const address = {
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
      };

      await database.$transaction(async (tx) => {
        await tx.student.updateMany({
          where: { id: input.studentId, organizationId: ctx.organizationId },
          data: {
            fullName: input.fullName,
            levelId,
            dateOfBirth: input.dateOfBirth
              ? parseCalendarDate(input.dateOfBirth)
              : undefined,
            enrolledAt: input.enrolledAt
              ? parseCalendarDate(input.enrolledAt)
              : undefined,
            gender: input.gender,
            phone: input.studentPhone,
            email: input.studentEmail,
            ...address,
            city: input.city,
            state: input.state,
            postcode: input.postcode,
            preferredName: input.preferredName,
            schoolName: input.schoolName,
            photoKey: input.photoKey,
            notes: input.notes,
          },
        });

        const guardianAddress = input.sameAsStudentAddress
          ? address
          : {
              addressLine1: input.guardianAddressLine1,
              addressLine2: input.guardianAddressLine2,
            };

        await tx.guardian.updateMany({
          where: {
            id: input.guardianId,
            organizationId: ctx.organizationId,
          },
          data: {
            email: input.guardianEmail,
            fullName: input.guardianName,
            phone: input.guardianPhone,
            ...guardianAddress,
            city: input.sameAsStudentAddress ? input.city : undefined,
            state: input.sameAsStudentAddress ? input.state : undefined,
            postcode: input.sameAsStudentAddress ? input.postcode : undefined,
          },
        });
      });

      return { ok: true };
    }),

  archive: roleProcedure(["ADMIN"])
    .input(studentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const archivedAt = new Date();

      await database.$transaction(async (tx) => {
        await tx.student.updateMany({
          where: { id: input.studentId, organizationId: ctx.organizationId },
          data: { archivedAt, status: "ARCHIVED" },
        });
        await tx.enrollment.updateMany({
          where: {
            studentId: input.studentId,
            organizationId: ctx.organizationId,
          },
          data: { archivedAt, status: "ARCHIVED" },
        });
      });

      return { ok: true };
    }),

  restore: roleProcedure(["ADMIN"])
    .input(studentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const student = await database.student.findFirst({
        where: { id: input.studentId, organizationId: ctx.organizationId },
        select: { id: true },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found.",
        });
      }

      await database.student.update({
        where: { id: student.id },
        data: { archivedAt: null, status: "ACTIVE" },
      });

      return { ok: true };
    }),
});
