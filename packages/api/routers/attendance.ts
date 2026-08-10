import { type AttendanceStatus, database } from "@repo/database";
import {
  markAttendanceInputSchema,
  markSessionAttendanceStatusInputSchema,
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
});

export type { MarkAttendanceInput } from "@repo/schemas/attendance";
