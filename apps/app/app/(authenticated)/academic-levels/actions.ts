"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getInt = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" ? Number.parseInt(value, 10) : undefined;
};

export const getLevels = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  return database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, order: true },
  });
};

export const createLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Level name is required.");
  }

  const existing = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      name,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A level with this name already exists.");
  }

  const counts = await database.level.aggregate({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    _max: { order: true },
  });

  await database.level.create({
    data: {
      organizationId: tenant.organizationId,
      name,
      order: (counts._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/academic-levels");
};

export const updateLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const levelId = getString(formData, "levelId");
  const name = getString(formData, "name");

  if (!(levelId && name)) {
    throw new Error("Level is required.");
  }

  const duplicate = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      name,
      archivedAt: null,
      NOT: { id: levelId },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A level with this name already exists.");
  }

  await database.level.updateMany({
    where: { id: levelId, organizationId: tenant.organizationId },
    data: { name },
  });

  revalidatePath("/academic-levels");
};

export const archiveLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const levelId = getString(formData, "levelId");

  if (!levelId) {
    throw new Error("Level is required.");
  }

  await database.$transaction([
    database.student.updateMany({
      where: { levelId },
      data: { levelId: null },
    }),
    database.learningClass.updateMany({
      where: { levelId },
      data: { levelId: null },
    }),
    database.level.updateMany({
      where: { id: levelId, organizationId: tenant.organizationId },
      data: { archivedAt: new Date() },
    }),
  ]);

  revalidatePath("/academic-levels");
};