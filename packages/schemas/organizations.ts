import { z } from "zod";
import { entityIdSchema } from "./common";

export const switchOrganizationInputSchema = z.strictObject({
  organizationId: entityIdSchema,
});

export type SwitchOrganizationInput = z.infer<
  typeof switchOrganizationInputSchema
>;
