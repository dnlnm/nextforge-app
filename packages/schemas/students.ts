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
  fullName: z.string().trim().min(1),
  gender: genderSchema,
  guardianAddressLine1: optionalText,
  guardianAddressLine2: optionalText,
  guardianEmail: email,
  guardianName: z.string().trim().min(1),
  guardianPhone: phone,
  levelId: entityIdSchema.optional(),
  notes: optionalText,
  photoKey: optionalText,
  postcode: postcode.optional(),
  preferredName: optionalText,
  relationship: guardianRelationshipSchema.optional(),
  sameAsStudentAddress: z.boolean(),
  schoolName: optionalText,
  state: optionalText,
  studentEmail: email,
  studentPhone: phone.optional(),
};

export const createStudentInputSchema = z
  .strictObject(studentFields)
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
export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;
export type StudentsQueryParams = z.infer<typeof studentsQueryParamsSchema>;
export type StudentIdInput = z.infer<typeof studentIdInputSchema>;
