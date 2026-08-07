"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getInt = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) || parsed < 1 ? undefined : parsed;
};

const getRoomName = (formData: FormData) => {
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Room name is required.");
  }

  return name;
};

const assertUniqueRoom = async (
  organizationId: string,
  name: string,
  excludedId?: string
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

  if (duplicate) {
    throw new Error("A room with this name already exists.");
  }
};

export const createRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getRoomName(formData);

  await assertUniqueRoom(tenant.organizationId, name);

  await database.room.create({
    data: {
      capacity: getInt(formData, "capacity"),
      location: getString(formData, "location"),
      name,
      organizationId: tenant.organizationId,
    },
  });

  revalidatePath("/rooms");
  revalidatePath("/classes/new");
};

export const updateRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const roomId = getString(formData, "roomId");

  if (!roomId) {
    throw new Error("Room is required.");
  }

  const name = getRoomName(formData);

  await assertUniqueRoom(tenant.organizationId, name, roomId);

  await database.room.updateMany({
    where: { id: roomId, organizationId: tenant.organizationId },
    data: {
      capacity: getInt(formData, "capacity"),
      location: getString(formData, "location"),
      name,
    },
  });

  revalidatePath("/rooms");
  revalidatePath("/classes/new");
  redirect("/rooms");
};

export const archiveRoom = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const roomId = getString(formData, "roomId");

  if (!roomId) {
    throw new Error("Room is required.");
  }

  const activeSchedules = await database.classSchedule.count({
    where: {
      roomId,
      class: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
    },
  });

  if (activeSchedules > 0) {
    throw new Error(
      `Cannot archive this room: it is used by ${activeSchedules} active class schedule(s).`
    );
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
  const roomId = getString(formData, "roomId");

  if (!roomId) {
    throw new Error("Room is required.");
  }

  const archived = await database.room.findFirst({
    where: { id: roomId, organizationId: tenant.organizationId },
    select: { archivedAt: true, name: true },
  });

  if (!archived?.archivedAt) {
    throw new Error("Room not found or not archived.");
  }

  await assertUniqueRoom(tenant.organizationId, archived.name, roomId);

  await database.room.updateMany({
    where: { id: roomId, organizationId: tenant.organizationId },
    data: { archivedAt: null, status: "ACTIVE" },
  });

  revalidatePath("/rooms");
  revalidatePath("/classes/new");
};
