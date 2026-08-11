import { z } from "zod";
import { dateStringSchema, entityIdSchema } from "./common";
import { attendanceStatusSchema } from "./enums";

export const createClassSessionInputSchema = z.strictObject({
  classId: entityIdSchema,
  sessionDate: dateStringSchema,
});

export const attendanceRecordInputSchema = z.strictObject({
  status: attendanceStatusSchema,
  studentId: entityIdSchema,
});

export const markAttendanceInputSchema = z.strictObject({
  records: z.array(attendanceRecordInputSchema),
  sessionId: entityIdSchema,
});

export const markSessionAttendanceStatusInputSchema = z.strictObject({
  sessionId: entityIdSchema,
  status: attendanceStatusSchema,
});

/** Roster + attendance records for a single session. */
export const sessionAttendanceInputSchema = z.strictObject({
  sessionId: entityIdSchema,
});

/** Recent sessions for a class, with attendance summaries. */
export const attendanceHistoryInputSchema = z.strictObject({
  classId: entityIdSchema,
  limit: z.int().positive().max(60).default(10),
});

export type CreateClassSessionInput = z.infer<
  typeof createClassSessionInputSchema
>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceInputSchema>;
export type MarkSessionAttendanceStatusInput = z.infer<
  typeof markSessionAttendanceStatusInputSchema
>;
export type SessionAttendanceInput = z.infer<
  typeof sessionAttendanceInputSchema
>;
export type AttendanceHistoryInput = z.infer<
  typeof attendanceHistoryInputSchema
>;
