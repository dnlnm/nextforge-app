import { z } from "zod";

export const attendanceStatuses = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;
export const attendanceStatusSchema = z.enum(attendanceStatuses);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export const dayOfWeekSchema = z.enum(daysOfWeek);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

export const genders = ["MALE", "FEMALE", "OTHER"] as const;
export const genderSchema = z.enum(genders);
export type Gender = z.infer<typeof genderSchema>;

export const guardianRelationships = [
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "OTHER",
] as const;
export const guardianRelationshipSchema = z.enum(guardianRelationships);
export type GuardianRelationship = z.infer<typeof guardianRelationshipSchema>;

export const studentStatuses = ["ACTIVE", "ARCHIVED"] as const;
export const studentStatusSchema = z.enum(studentStatuses);
export type StudentStatus = z.infer<typeof studentStatusSchema>;

export const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "DUITNOW",
  "FPX",
  "CARD",
  "OTHER",
] as const;
export const paymentMethodSchema = z.enum(paymentMethods);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const paymentStatuses = ["RECORDED", "VERIFIED", "REVERSED"] as const;
export const paymentStatusSchema = z.enum(paymentStatuses);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
