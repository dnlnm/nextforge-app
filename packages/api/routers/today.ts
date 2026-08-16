import { database } from "@repo/database";
import {
  getMalaysiaDateParts,
  getMalaysiaWeekday,
  parseCalendarDate,
} from "@repo/date";
import { createClassSessionInputSchema } from "@repo/schemas/attendance";
import { todaySessionsInputSchema } from "@repo/schemas/today";
import { getTeacherProfileId } from "../lib/teacher-profile";
import { roleProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

export const todayRouter = createTRPCRouter({
  sessions: roleProcedure(["TEACHER"])
    .input(todaySessionsInputSchema)
    .query(async ({ ctx, input }) => {
      const today = getMalaysiaDateParts();
      const date = input.date ? parseCalendarDate(input.date) : today.date;
      const dayOfWeek = input.date ? getMalaysiaWeekday(date) : today.dayOfWeek;
      const teacherProfileId = await getTeacherProfileId(ctx);

      const [todayClassCount, sessions] = await Promise.all([
        database.classSchedule.count({
          where: {
            dayOfWeek,
            class: {
              organizationId: ctx.organizationId,
              status: "ACTIVE",
              ...(teacherProfileId ? { teacherId: teacherProfileId } : {}),
            },
          },
        }),
        database.classSession.findMany({
          where: {
            organizationId: ctx.organizationId,
            sessionDate: date,
            ...(teacherProfileId
              ? { class: { teacherId: teacherProfileId } }
              : {}),
          },
          orderBy: { startsAt: "asc" },
          include: {
            // `attendance` and `class.enrollments` are consumed for their
            // length on the mobile Today screen; narrow the projected columns
            // for subject/teacher to the names actually rendered.
            attendance: {
              select: { id: true, status: true, studentId: true },
            },
            class: {
              include: {
                enrollments: {
                  where: { status: "ACTIVE" },
                  select: {
                    id: true,
                    student: { select: { code: true, fullName: true, id: true } },
                  },
                  orderBy: { student: { fullName: "asc" } },
                },
                subject: { select: { name: true } },
                teacher: { select: { fullName: true } },
              },
            },
          },
        }),
      ]);

      return { date, todayClassCount, sessions };
    }),

  createSessions: roleProcedure(["TEACHER"]).mutation(async ({ ctx }) => {
    const today = getMalaysiaDateParts();
    const teacherProfileId = await getTeacherProfileId(ctx);
    const schedules = await database.classSchedule.findMany({
      where: {
        dayOfWeek: today.dayOfWeek,
        class: {
          organizationId: ctx.organizationId,
          status: "ACTIVE",
          ...(teacherProfileId ? { teacherId: teacherProfileId } : {}),
        },
      },
      select: {
        classId: true,
        endsAt: true,
        startsAt: true,
      },
    });

    // Create/refresh today's sessions atomically so a partial failure can't
    // leave some classes with sessions and others without.
    await database.$transaction(async (tx) => {
      for (const schedule of schedules) {
        await tx.classSession.upsert({
          where: {
            classId_sessionDate: {
              classId: schedule.classId,
              sessionDate: today.date,
            },
          },
          create: {
            organizationId: ctx.organizationId,
            classId: schedule.classId,
            endsAt: schedule.endsAt,
            sessionDate: today.date,
            startsAt: schedule.startsAt,
          },
          update: {
            endsAt: schedule.endsAt,
            startsAt: schedule.startsAt,
          },
        });
      }
    });

    return { created: schedules.length };
  }),

  createClassSession: roleProcedure(["ADMIN"])
    .input(createClassSessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionDate = parseCalendarDate(input.sessionDate);

      const learningClass = await database.learningClass.findFirst({
        where: { id: input.classId, organizationId: ctx.organizationId },
        select: { id: true },
      });

      if (!learningClass) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
      }

      const dayOfWeek = getMalaysiaWeekday(sessionDate);
      const schedule = await database.classSchedule.findFirst({
        where: {
          classId: learningClass.id,
          dayOfWeek,
          class: { organizationId: ctx.organizationId },
        },
        select: { endsAt: true, startsAt: true },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No class schedule found for the selected date. Create a session for a day this class is scheduled.",
        });
      }

      await database.classSession.upsert({
        where: {
          classId_sessionDate: {
            classId: learningClass.id,
            sessionDate,
          },
        },
        create: {
          organizationId: ctx.organizationId,
          classId: learningClass.id,
          endsAt: schedule.endsAt,
          sessionDate,
          startsAt: schedule.startsAt,
        },
        update: {
          endsAt: schedule.endsAt,
          startsAt: schedule.startsAt,
        },
      });

      return { ok: true };
    }),
});
