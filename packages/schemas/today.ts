import { z } from "zod";
import { dateStringSchema } from "./common";

export const todaySessionsInputSchema = z.strictObject({
  date: dateStringSchema.optional(),
});

export type TodaySessionsInput = z.infer<typeof todaySessionsInputSchema>;
