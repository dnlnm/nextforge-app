import { z } from "zod";

export const entityIdSchema = z.string().trim().min(1);

export const dateStringSchema = z.iso.date();

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use the HH:MM format.");

export const moneySenSchema = z.int().nonnegative();

export const positiveMoneySenSchema = z.int().positive();

export const paginationSchema = z.strictObject({
  page: z.int().nonnegative(),
  pageSize: z.int().positive().max(100),
});

export const sortingSchema = z.array(
  z.strictObject({
    desc: z.boolean(),
    id: z.string().trim().min(1),
  })
);

export const filterSchema = z.strictObject({
  id: z.string().trim().min(1),
  value: z.unknown(),
});
