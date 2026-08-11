import { z } from "zod";
import { dateStringSchema, entityIdSchema, moneySenSchema } from "./common";

export const enrollStudentInputSchema = z.strictObject({
  classId: entityIdSchema,
  customFeeSen: moneySenSchema.optional(),
  startsOn: dateStringSchema.optional(),
  studentId: entityIdSchema,
});

export const bulkEnrollStudentsInputSchema = z.strictObject({
  classId: entityIdSchema,
  customFeeSen: moneySenSchema.optional(),
  startsOn: dateStringSchema.optional(),
  studentIds: z.array(entityIdSchema).min(1),
});

export const transferStudentInputSchema = z.strictObject({
  destinationClassId: entityIdSchema,
  destinationCustomFeeSen: moneySenSchema.optional(),
  sourceEnrollmentId: entityIdSchema,
  startsOn: dateStringSchema.optional(),
});

export const updateEnrollmentInputSchema = z.strictObject({
  customFeeSen: moneySenSchema.optional(),
  enrollmentId: entityIdSchema,
  startsOn: dateStringSchema.optional(),
});

export const endEnrollmentInputSchema = z.strictObject({
  enrollmentId: entityIdSchema,
});

export type EnrollStudentInput = z.infer<typeof enrollStudentInputSchema>;
export type BulkEnrollStudentsInput = z.infer<
  typeof bulkEnrollStudentsInputSchema
>;
export type TransferStudentInput = z.infer<typeof transferStudentInputSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentInputSchema>;
export type EndEnrollmentInput = z.infer<typeof endEnrollmentInputSchema>;
