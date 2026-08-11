import { z } from "zod";
import {
  dateStringSchema,
  entityIdSchema,
  moneySenSchema,
  timeStringSchema,
} from "./common";
import { dayOfWeekSchema } from "./enums";

export {
  type EndEnrollmentInput,
  type EnrollStudentInput,
  endEnrollmentInputSchema,
  enrollStudentInputSchema,
} from "./enrollments";

export const classScheduleInputSchema = z
  .strictObject({
    dayOfWeek: dayOfWeekSchema,
    endsAt: timeStringSchema,
    roomId: entityIdSchema,
    startsAt: timeStringSchema,
  })
  .refine(({ endsAt, startsAt }) => endsAt > startsAt, {
    message: "Schedule end time must be after the start time.",
    path: ["endsAt"],
  });

const classFields = {
  academicYear: z.int().min(2000).max(2100),
  capacity: z.int().positive().optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]+$/)
    .optional(),
  endDate: dateStringSchema.optional(),
  levelId: entityIdSchema.optional(),
  monthlyFeeSen: moneySenSchema.or(z.literal(0)),
  name: z.string().trim().min(1),
  schedules: z.array(classScheduleInputSchema).min(1),
  startDate: dateStringSchema,
  subjectId: entityIdSchema,
  teacherId: entityIdSchema.nullable().optional(),
};

export const createClassInputSchema = z.strictObject(classFields);
export const updateClassInputSchema = z.strictObject({
  ...classFields,
  classId: entityIdSchema,
});

export const classIdInputSchema = z.strictObject({
  classId: entityIdSchema,
});

export const classesListInputSchema = z.strictObject({
  page: z.int().nonnegative().optional(),
  pageSize: z.int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
});

export type ClassScheduleInput = z.infer<typeof classScheduleInputSchema>;
export type CreateClassInput = z.infer<typeof createClassInputSchema>;
export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;
export type ClassIdInput = z.infer<typeof classIdInputSchema>;
export type ClassesListInput = z.infer<typeof classesListInputSchema>;
