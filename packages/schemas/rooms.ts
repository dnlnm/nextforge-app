import { z } from "zod";

import { entityIdSchema } from "./common";

export const createRoomInputSchema = z.strictObject({
  name: z.string().trim().min(1, "Room name is required."),
  capacity: z.coerce.number().int().min(1).optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().optional(),
});

export const updateRoomInputSchema = z.strictObject({
  roomId: entityIdSchema,
  name: z.string().trim().min(1, "Room name is required."),
  capacity: z.coerce.number().int().min(1).optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().optional(),
});

export const archiveRoomInputSchema = z.strictObject({
  roomId: entityIdSchema,
});

export const restoreRoomInputSchema = z.strictObject({
  roomId: entityIdSchema,
});

export type CreateRoomInput = z.infer<typeof createRoomInputSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomInputSchema>;
