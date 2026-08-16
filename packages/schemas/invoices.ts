import { z } from "zod";
import {
  entityIdSchema,
  filterSchema,
  paginationSchema,
  sortingSchema,
} from "./common";

export const invoicesQueryParamsSchema = paginationSchema.extend({
  filters: z.array(filterSchema).optional(),
  search: z.string().trim().min(1).optional(),
  sorting: sortingSchema.optional(),
});

export const voidInvoicesInputSchema = z.strictObject({
  invoiceIds: z.array(entityIdSchema).min(1),
});

export type InvoicesQueryParams = z.infer<typeof invoicesQueryParamsSchema>;
export type VoidInvoicesInput = z.infer<typeof voidInvoicesInputSchema>;

export const billingMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Billing month must use YYYY-MM format.");

export const generateMonthlyInvoicesInputSchema = z.strictObject({
  billingMonth: billingMonthSchema,
});

export type GenerateMonthlyInvoicesInput = z.infer<
  typeof generateMonthlyInvoicesInputSchema
>;
