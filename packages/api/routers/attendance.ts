import { type AttendanceStatus, database } from "@repo/database";
import {
  attendanceHistoryInputSchema,
  markAttendanceInputSchema,
  markSessionAttendanceStatusInputSchema,
  sessionAttendanceInputSchema,
} from "@repo/schemas/attendance";
import { getTeacherProfileId } from "../lib/teacher-profile";
import { roleProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

const findAuthorizedSession = async (
  ctx: {
    readonly organizationId: string;
    readonly role: string;
    readonly userId: string;
  },
  sessionId: string
) => {
  const teacherProfileId = await getTeacherProfileId(ctx);

  return database.classSession.findFirst({
    where: {
      id: sessionId,
      organizationId: ctx.organizationId,
      ...(teacherProfileId ? { class: { teacherId: teacherProfileId } } : {}),
    },
    include: {
      class: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
      },
    },
  });
};

const upsertAttendance = async (
  ctx: { readonly organizationId: string; readonly userId: string },
  input: {
    session: { id: string };
    records: Array<{ status: AttendanceStatus; studentId: string }>;
  }
) => {
  await database.$transaction(async (tx) => {
    for (const record of input.records) {
      await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: input.session.id,
            studentId: record.studentId,
          },
        },
        create: {
          organizationId: ctx.organizationId,
          markedByUserId: ctx.userId,
          sessionId: input.session.id,
          status: record.status,
          studentId: record.studentId,
        },
        update: {
          markedAt: new Date(),
          markedByUserId: ctx.userId,
          status: record.status,
        },
      });
    }

    await tx.classSession.update({
      where: { id: input.session.id },
      data: { status: "COMPLETED" },
    });
  });
};

export const attendanceRouter = createTRPCRouter({
  markAttendance: roleProcedure(["TEACHER"])
    .input(markAttendanceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await findAuthorizedSession(ctx, input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found.",
        });
      }

      const enrolledStudentIds = new Set(
        session.class.enrollments.map((enrollment) => enrollment.studentId)
      );
      const records: Array<{ status: AttendanceStatus; studentId: string }> =
        input.records
          .filter((record) => enrolledStudentIds.has(record.studentId))
          .map((record) => ({
            status: record.status,
            studentId: record.studentId,
          }));

      await upsertAttendance(ctx, { session, records });

      return { ok: true };
    }),

  markSessionAttendanceStatus: roleProcedure(["TEACHER"])
    .input(markSessionAttendanceStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await findAuthorizedSession(ctx, input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found.",
        });
      }

      const records = session.class.enrollments.map(
        (enrollment) =>
          ({
            status: input.status,
            studentId: enrollment.studentId,
          }) as { status: AttendanceStatus; studentId: string }
      );

      await upsertAttendance(ctx, { session, records });

      return { ok: true };
    }),

  /**
   * Roster + attendance records for a single session, so a teacher can open a
   * class from Today and mark (or edit) attendance in one screen.
   */
  session: roleProcedure(["TEACHER"])
    .input(sessionAttendanceInputSchema)
    .query(async ({ ctx, input }) => {
      const teacherProfileId = await getTeacherProfileId(ctx);

      const session = await database.classSession.findFirst({
        where: {
          id: input.sessionId,
          organizationId: ctx.organizationId,
          ...(teacherProfileId
            ? { class: { teacherId: teacherProfileId } }
            : {}),
        },
        include: {
          class: {
            select: {
              code: true,
              id: true,
              name: true,
            },
          },
          attendance: {
            select: {
              notes: true,
              status: true,
              studentId: true,
            },
          },
          _count: {
            select: {
              attendance: true,
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found.",
        });
      }

      const enrollments = await database.enrollment.findMany({
        where: {
          classId: session.class.id,
          status: "ACTIVE",
          archivedAt: null,
        },
        select: {
          id: true,
          student: {
            select: {
              code: true,
              fullName: true,
              id: true,
              photoKey: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const recordsByStudent = new Map(
        session.attendance.map((record) => [record.studentId, record])
      );

      return {
        ...session,
        roster: enrollments.map((enrollment) => ({
          attendanceStatus:
            recordsByStudent.get(enrollment.student.id)?.status ?? null,
          student: enrollment.student,
        })),
      };
    }),

  /** Recent sessions for a class, with present/absent summaries. */
  history: roleProcedure(["TEACHER"])
    .input(attendanceHistoryInputSchema)
    .query(async ({ ctx, input }) => {
      const teacherProfileId = await getTeacherProfileId(ctx);

      const classBelongsToOrg = await database.learningClass.findFirst({
        where: {
          id: input.classId,
          organizationId: ctx.organizationId,
          archivedAt: null,
          ...(teacherProfileId ? { teacherId: teacherProfileId } : {}),
        },
        select: { id: true },
      });

      if (!classBelongsToOrg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found.",
        });
      }

      const sessions = await database.classSession.findMany({
        where: { classId: input.classId },
        orderBy: { sessionDate: "desc" },
        take: input.limit,
        include: {
          _count: { select: { attendance: true } },
        },
      });

      const sessionIds = sessions.map((session) => session.id);
      const records = sessionIds.length
        ? await database.attendanceRecord.groupBy({
            by: ["sessionId", "status"],
            where: { sessionId: { in: sessionIds } },
            _count: { _all: true },
          })
        : [];

      const summaryBySession = new Map<
        string,
        { present: number; absent: number }
      >();

      for (const record of records) {
        const summary = summaryBySession.get(record.sessionId) ?? {
          present: 0,
          absent: 0,
        };
        if (record.status === "PRESENT") {
          summary.present = record._count._all;
        } else if (record.status === "ABSENT") {
          summary.absent = record._count._all;
        }
        summaryBySession.set(record.sessionId, summary);
      }

      return sessions.map((session) => ({
        ...session,
        markedCount: session._count.attendance,
        present: summaryBySession.get(session.id)?.present ?? 0,
        absent: summaryBySession.get(session.id)?.absent ?? 0,
      }));
    }),
});

export type { MarkAttendanceInput } from "@repo/schemas/attendance";
