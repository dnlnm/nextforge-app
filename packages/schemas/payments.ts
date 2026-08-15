import { z } from "zod";
import { entityIdSchema, positiveMoneySenSchema } from "./common";
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

export type RecordPaymentInput = z.infer<typeof recordPaymentInputSchema>;
export type ReversePaymentInput = z.infer<typeof reversePaymentInputSchema>;
