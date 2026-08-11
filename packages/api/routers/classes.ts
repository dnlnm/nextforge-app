import { database, Prisma } from "@repo/database";
import {
  classesListInputSchema,
  classIdInputSchema,
  createClassInputSchema,
  endEnrollmentInputSchema,
  enrollStudentInputSchema,
  updateClassInputSchema,
} from "@repo/schemas/classes";
import {
  assertNoTeacherConflicts,
  assertSchedulesValid,
  resolveClassCode,
} from "../lib/classes";
import { getTeacherProfileId } from "../lib/teacher-profile";
import { assertWithinPlanLimit, roleProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

const parseDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const classesRouter = createTRPCRouter({
  /** Paginated list of active classes for the workspace. */
  list: roleProcedure(["TEACHER"])
    .input(classesListInputSchema)
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 0;
      const pageSize = input.pageSize ?? 50;

      const where: Prisma.LearningClassWhereInput = {
        organizationId: ctx.organizationId,
        status: "ACTIVE",
        archivedAt: null,
      };

      // Teachers only see the classes they teach (spec §5).
      const teacherProfileId = await getTeacherProfileId(ctx);

      if (teacherProfileId !== undefined) {
        where.teacherId = teacherProfileId;
      }

      if (input.search) {
        where.OR = [{ name: { contains: input.search, mode: "insensitive" } }];
      }

      const [classes, totalCount] = await Promise.all([
        database.learningClass.findMany({
          where,
          orderBy: [{ name: "asc" }],
          skip: page * pageSize,
          take: pageSize,
          include: {
            subject: { select: { name: true } },
            teacher: { select: { fullName: true } },
            level: { select: { name: true } },
            schedules: {
              select: { dayOfWeek: true, endsAt: true, startsAt: true },
            },
            _count: {
              select: {
                enrollments: {
                  where: { status: "ACTIVE", archivedAt: null },
                },
              },
            },
          },
        }),
        database.learningClass.count({ where }),
      ]);

      return {
        data: classes.map((c) => ({
          ...c,
          studentCount: c._count.enrollments,
        })),
        totalCount,
      };
    }),

  /** Single class with its roster (enrolled students) and schedules. */
  get: roleProcedure(["TEACHER"])
    .input(classIdInputSchema)
    .query(async ({ ctx, input }) => {
      const learningClass = await database.learningClass.findFirst({
        where: {
          id: input.classId,
          organizationId: ctx.organizationId,
          archivedAt: null,
        },
        include: {
          subject: true,
          teacher: { select: { fullName: true, id: true } },
          level: { select: { id: true, name: true } },
          schedules: {
            include: { room: { select: { name: true, id: true } } },
          },
          enrollments: {
            where: { status: "ACTIVE", archivedAt: null },
            include: {
              student: {
                select: {
                  code: true,
                  fullName: true,
                  id: true,
                  photoKey: true,
                  preferredName: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!learningClass) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found.",
        });
      }

      return {
        ...learningClass,
        studentCount: learningClass.enrollments.length,
      };
    }),

  /** Create a class with its schedules. Mirrors the web action. */
  create: roleProcedure(["ADMIN"])
    .input(createClassInputSchema)
    .mutation(async ({ ctx, input }) => {
      const startsOn = parseDate(input.startDate);
      const endsOn = input.endDate ? parseDate(input.endDate) : undefined;

      await assertSchedulesValid(ctx.organizationId, input.schedules);

      if (input.teacherId) {
        await assertNoTeacherConflicts(
          ctx.organizationId,
          input.teacherId,
          input.schedules
        );
      }

      const [subject, level, teacher] = await Promise.all([
        database.subject.findFirst({
          where: { id: input.subjectId, organizationId: ctx.organizationId },
          select: { code: true, id: true },
        }),
        database.level.findFirst({
          where: {
            id: input.levelId,
            organizationId: ctx.organizationId,
            archivedAt: null,
          },
          select: { code: true, id: true },
        }),
        input.teacherId
          ? database.teacherProfile.findFirst({
              where: {
                id: input.teacherId,
                organizationId: ctx.organizationId,
                archivedAt: null,
              },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found.",
        });
      }

      if (input.levelId && !level) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Level not found.",
        });
      }

      if (input.teacherId && !teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found.",
        });
      }

      await assertWithinPlanLimit(ctx, "classes");

      const code = await resolveClassCode(ctx.organizationId, {
        academicYear: input.academicYear,
        levelCode: level?.code ?? "GEN",
        subjectCode: subject.code,
        submittedCode: input.code,
      });

      const created = await database.$transaction(async (tx) => {
        const learningClass = await tx.learningClass.create({
          data: {
            academicYear: input.academicYear,
            capacity: input.capacity,
            code,
            endsOn,
            levelId: input.levelId,
            monthlyFeeSen: input.monthlyFeeSen,
            name: input.name,
            organizationId: ctx.organizationId,
            startsOn,
            subjectId: subject.id,
            teacherId: input.teacherId,
          },
          select: { id: true },
        });

        await tx.classSchedule.createMany({
          data: input.schedules.map((schedule) => ({
            classId: learningClass.id,
            dayOfWeek: schedule.dayOfWeek,
            endsAt: schedule.endsAt,
            roomId: schedule.roomId,
            startsAt: schedule.startsAt,
          })),
        });

        return learningClass;
      });

      return { classId: created.id };
    }),

  /** Update a class and replace its schedules. Mirrors the web action. */
  update: roleProcedure(["ADMIN"])
    .input(updateClassInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await database.learningClass.findFirst({
        where: {
          id: input.classId,
          organizationId: ctx.organizationId,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found.",
        });
      }

      const startsOn = parseDate(input.startDate);
      const endsOn = input.endDate ? parseDate(input.endDate) : undefined;

      await assertSchedulesValid(ctx.organizationId, input.schedules);

      if (input.teacherId) {
        await assertNoTeacherConflicts(
          ctx.organizationId,
          input.teacherId,
          input.schedules,
          input.classId
        );
      }

      if (input.code) {
        const clash = await database.learningClass.findFirst({
          where: {
            organizationId: ctx.organizationId,
            code: input.code,
            NOT: { id: input.classId },
          },
          select: { id: true },
        });

        if (clash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A class with this code already exists.",
          });
        }
      }

      await database.$transaction(async (tx) => {
        await tx.learningClass.updateMany({
          where: { id: input.classId, organizationId: ctx.organizationId },
          data: {
            academicYear: input.academicYear,
            capacity: input.capacity,
            code: input.code,
            endsOn,
            levelId: input.levelId,
            monthlyFeeSen: input.monthlyFeeSen,
            name: input.name,
            startsOn,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
          },
        });

        await tx.classSchedule.deleteMany({
          where: { classId: input.classId },
        });
        await tx.classSchedule.createMany({
          data: input.schedules.map((schedule) => ({
            classId: input.classId,
            dayOfWeek: schedule.dayOfWeek,
            endsAt: schedule.endsAt,
            roomId: schedule.roomId,
            startsAt: schedule.startsAt,
          })),
        });
      });

      return { classId: input.classId };
    }),

  /** Archive a class and its enrollments. Mirrors the web action. */
  archive: roleProcedure(["ADMIN"])
    .input(classIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const archivedAt = new Date();

      const result = await database.$transaction(async (tx) => {
        const updated = await tx.learningClass.updateMany({
          where: { id: input.classId, organizationId: ctx.organizationId },
          data: { archivedAt, status: "ARCHIVED" },
        });

        if (updated.count === 0) {
          return 0;
        }

        await tx.enrollment.updateMany({
          where: { classId: input.classId, organizationId: ctx.organizationId },
          data: { archivedAt, status: "ARCHIVED" },
        });

        return updated.count;
      });

      if (result === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found.",
        });
      }

      return { ok: true };
    }),

  /** Enrol a student into a class. Mirrors the web action. */
  enrollStudent: roleProcedure(["ADMIN"])
    .input(enrollStudentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [learningClass, student] = await Promise.all([
        database.learningClass.findFirst({
          where: {
            id: input.classId,
            organizationId: ctx.organizationId,
          },
          select: { id: true },
        }),
        database.student.findFirst({
          where: { id: input.studentId, organizationId: ctx.organizationId },
          select: { id: true },
        }),
      ]);

      if (!(learningClass && student)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class or student not found.",
        });
      }

      try {
        await database.enrollment.create({
          data: {
            organizationId: ctx.organizationId,
            classId: learningClass.id,
            customFeeSen: input.customFeeSen,
            startsOn: input.startsOn ? parseDate(input.startsOn) : new Date(),
            studentId: student.id,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This student is already enrolled in the class.",
          });
        }
        throw error;
      }

      return { ok: true };
    }),

  /** End a student's enrolment in a class. Mirrors the web action. */
  endEnrollment: roleProcedure(["ADMIN"])
    .input(endEnrollmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await database.enrollment.updateMany({
        where: { id: input.enrollmentId, organizationId: ctx.organizationId },
        data: { endsOn: new Date(), status: "ENDED" },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Enrollment not found.",
        });
      }

      return { ok: true };
    }),
});
