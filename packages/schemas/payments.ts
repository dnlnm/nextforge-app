import { z } from "zod";
import {
  entityIdSchema,
  filterSchema,
  paginationSchema,
  positiveMoneySenSchema,
  sortingSchema,
} from "./common";
import { paymentMethodSchema } from "./enums";

export const recordPaymentInputSchema = z.strictObject({
  amountSen: positiveMoneySenSchema,
  invoiceId: entityIdSchema,
  method: paymentMethodSchema,
  notes: z.string().trim().min(1).optional(),
  reference: z.string().trim().min(1).optional(),
});

export const reversePaymentInputSchema = z.strictObject({
  paymentId: entityIdSchema,
});

export const verifyPaymentInputSchema = z.strictObject({
  paymentId: entityIdSchema,
});

export const paymentsQueryParamsSchema = paginationSchema.extend({
  filters: z.array(filterSchema).optional(),
  search: z.string().trim().min(1).optional(),
  sorting: sortingSchema.optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentInputSchema>;
export type ReversePaymentInput = z.infer<typeof reversePaymentInputSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInputSchema>;
export type PaymentsQueryParams = z.infer<typeof paymentsQueryParamsSchema>;
