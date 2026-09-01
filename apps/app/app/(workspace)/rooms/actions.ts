"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  archiveRoomInputSchema,
  createRoomInputSchema,
  restoreRoomInputSchema,
  updateRoomInputSchema,
} from "@repo/schemas/rooms";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getInt = (formData: FormData, key: string) => {
  const value = getString(formData, key);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? undefined : parsed;
};

const assertUniqueRoom = async (
  organizationId: string,
  name: string,
  excludedId?: string,
) => {
  const duplicate = await database.room.findFirst({
    where: {
      organizationId,
      name: { equals: name, mode: "insensitive" },
      archivedAt: null,
      ...(excludedId ? { NOT: { id: excludedId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) throw new Error("A room with this name already exists.");
};

export const createRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const parsed = createRoomInputSchema.safeParse({
    name: getString(formData, "name"),
    capacity: getString(formData, "capacity"),
    location: getString(formData, "location"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { name, location } = parsed.data;
  const capacity = getInt(formData, "capacity");
  await assertUniqueRoom(tenant.organizationId, name);
  await database.room.create({
    data: { capacity, location, name, organizationId: tenant.organizationId },
  });
  revalidatePath("/rooms");
  revalidatePath("/classes/new");
};

export const updateRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const parsed = updateRoomInputSchema.safeParse({
    roomId: getString(formData, "roomId"),
    name: getString(formData, "name"),
    capacity: getString(formData, "capacity"),
    location: getString(formData, "location"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { roomId, name, location } = parsed.data;
  const capacity = getInt(formData, "capacity");
  await assertUniqueRoom(tenant.organizationId, name, roomId);
  await database.room.updateMany({
    where: { id: roomId, organizationId: tenant.organizationId },
    data: { capacity, location, name },
  });
  revalidatePath("/rooms");
  revalidatePath("/classes/new");
  redirect("/rooms");
};

export const archiveRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const parsed = archiveRoomInputSchema.safeParse({ roomId: getString(formData, "roomId") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { roomId } = parsed.data;
  const blocking = await database.classSchedule.findMany({
    where: {
      roomId,
      class: { archivedAt: null, organizationId: tenant.organizationId, status: "ACTIVE" },
    },
    select: { class: { select: { name: true } } },
  });
  if (blocking.length > 0) {
    const names = blocking.map((b) => b.class.name).join(", ");
    throw new Error(`Cannot archive: used by ${blocking.length} active schedule(s): ${names}.`);
  }
  await database.room.updateMany({
    where: { id: roomId, organizationId: tenant.organizationId },
    data: { archivedAt: new Date(), status: "ARCHIVED" },
  });
  revalidatePath("/rooms");
  revalidatePath("/classes/new");
};

export const restoreRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const parsed = restoreRoomInputSchema.safeParse({ roomId: getString(formData, "roomId") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { roomId } = parsed.data;
  const archived = await database.room.findFirst({
    where: { id: roomId, organizationId: tenant.organizationId },
    select: { archivedAt: true, name: true },
  });
  if (!archived?.archivedAt) throw new Error("Room not found or not archived.");
  await assertUniqueRoom(tenant.organizationId, archived.name, roomId);
  await database.room.updateMany({
    where: { id: roomId, organizationId: tenant.organizationId },
    data: { archivedAt: null, status: "ACTIVE" },
  });
  revalidatePath("/rooms");
  revalidatePath("/classes/new");
};
