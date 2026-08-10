import { z } from "zod";

export const billingMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Billing month must use YYYY-MM format.");

export const generateMonthlyInvoicesInputSchema = z.strictObject({
  billingMonth: billingMonthSchema,
});

export type GenerateMonthlyInvoicesInput = z.infer<
  typeof generateMonthlyInvoicesInputSchema
>;
