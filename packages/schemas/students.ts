import { z } from "zod";
import {
  dateStringSchema,
  entityIdSchema,
  paginationSchema,
  sortingSchema,
} from "./common";
import { genderSchema, guardianRelationshipSchema } from "./enums";

const optionalText = z.string().trim().min(1).optional();
const email = z.email().optional();
const phone = z
  .string()
  .regex(/^01\d{8,10}$/, "Enter a valid Malaysian phone number.");
const postcode = z.string().regex(/^\d{5}$/, "Enter a 5-digit postcode.");

const studentFields = {
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  dateOfBirth: dateStringSchema.optional(),
  enrolledAt: dateStringSchema.optional(),
  emergencyContactName: optionalText,
  emergencyContactPhone: optionalText,
  firstName: optionalText,
  fullName: z.string().trim().min(1),
  gender: genderSchema,
  guardianAddressLine1: optionalText,
  guardianAddressLine2: optionalText,
  guardianEmail: email,
  guardianName: z.string().trim().min(1),
  guardianPhone: phone,
  icNumber: optionalText,
  invoiceDueDay: z.number().int().min(1).max(28).optional(),
  levelId: entityIdSchema.optional(),
  medicalNotes: optionalText,
  notes: optionalText,
  photoKey: optionalText,
  postcode: postcode.optional(),
  preferredName: optionalText,
  referralSource: optionalText,
  relationship: guardianRelationshipSchema.optional(),
  sameAsStudentAddress: z.boolean(),
  schoolName: optionalText,
  schoolType: optionalText,
  state: optionalText,
  studentEmail: email,
  studentPhone: phone.optional(),
};

/**
 * One parent/guardian contact block from the Add Student flow. The web form
 * serializes one of these into a JSON hidden field; API callers may pass the
 * array directly.
 */
export const guardianInputSchema = z.strictObject({
  address: optionalText,
  email: z.email(),
  fullName: z.string().trim().min(1),
  icNumber: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Enter a valid 12-digit IC number."),
  phone,
  relationship: guardianRelationshipSchema,
  whatsapp: optionalText,
});

/** A class enrollment requested at creation time (custom fee overrides the class fee). */
export const enrollmentRequestSchema = z.strictObject({
  classId: entityIdSchema,
  customFeeSen: z.number().int().positive().optional(),
});

export const createStudentInputSchema = z
  .strictObject({
    ...studentFields,
    enrollments: z.array(enrollmentRequestSchema).min(1).optional(),
    guardians: z.array(guardianInputSchema).length(1).optional(),
  })
  .refine(({ guardianEmail, studentEmail }) => guardianEmail || studentEmail, {
    message: "At least one student or guardian email address is required.",
    path: ["studentEmail"],
  });

export const updateStudentInputSchema = z.strictObject({
  ...studentFields,
  guardianId: entityIdSchema,
  studentId: entityIdSchema,
});

/**
 * One advanced-filter rule from the data-table filter menu (ExtendedColumnFilter
 * minus its regenerable `filterId`). `joinOperator` is how this rule joins with
 * the previous one ("and" | "or"); `operator` follows SQL-style
 * names (eq, neq, in, not.in, ilike, not.ilike, empty, not.empty, ...).
 */
export const studentTableFilterSchema = z.object({
  id: z.string().trim().min(1),
  joinOperator: z.string().optional(),
  operator: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.null()]),
  variant: z.string(),
});

export const studentsQueryParamsSchema = paginationSchema.extend({
  filters: z.array(studentTableFilterSchema).optional(),
  search: z.string().trim().min(1).optional(),
  sorting: sortingSchema.optional(),
});

export const studentIdInputSchema = z.strictObject({
  studentId: entityIdSchema,
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;
export type GuardianInput = z.infer<typeof guardianInputSchema>;
export type EnrollmentRequest = z.infer<typeof enrollmentRequestSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;
export type StudentTableFilter = z.infer<typeof studentTableFilterSchema>;
export type StudentsQueryParams = z.infer<typeof studentsQueryParamsSchema>;
export type StudentIdInput = z.infer<typeof studentIdInputSchema>;
