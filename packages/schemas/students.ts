import { z } from "zod";
import {
  dateStringSchema,
  entityIdSchema,
  filterSchema,
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
 * serializes 1–3 of these into a JSON hidden field; API callers may pass the
 * array directly.
 */
export const guardianInputSchema = z.strictObject({
  email,
  fullName: z.string().trim().min(1),
  icNumber: optionalText,
  phone,
  relationship: guardianRelationshipSchema.optional(),
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
    guardians: z.array(guardianInputSchema).min(1).max(3).optional(),
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

export const studentsQueryParamsSchema = paginationSchema.extend({
  filters: z.array(filterSchema).optional(),
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
export type StudentsQueryParams = z.infer<typeof studentsQueryParamsSchema>;
export type StudentIdInput = z.infer<typeof studentIdInputSchema>;
