"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type LevelStage } from "@repo/database";
import { revalidatePath } from "next/cache";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const LEVEL_STAGES: LevelStage[] = [
  "PRIMARY",
  "LOWER_SECONDARY",
  "UPPER_SECONDARY",
  "PRE_UNIVERSITY",
  "GENERAL",
];

const getStage = (formData: FormData): LevelStage => {
  const value = formData.get("stage");

  return typeof value === "string" && LEVEL_STAGES.includes(value as LevelStage)
    ? (value as LevelStage)
    : "GENERAL";
};

export const getLevels = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  return database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, order: true, stage: true },
  });
};

export const createLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");
  const stage = getStage(formData);

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
      stage,
      order: (counts._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/academic-levels");
};

export const updateLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const levelId = getString(formData, "levelId");
  const name = getString(formData, "name");
  const stage = getStage(formData);

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
    data: { name, stage },
  });

  revalidatePath("/academic-levels");
};

export const restoreLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const levelId = getString(formData, "levelId");

  if (!levelId) {
    throw new Error("Level is required.");
  }

  const archived = await database.level.findFirst({
    where: { id: levelId, organizationId: tenant.organizationId },
    select: { name: true, archivedAt: true },
  });

  if (!archived?.archivedAt) {
    throw new Error("Level not found or not archived.");
  }

  const active = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      name: archived.name,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (active) {
    throw new Error("A level with this name already exists.");
  }

  await database.level.updateMany({
    where: { id: levelId, organizationId: tenant.organizationId },
    data: { archivedAt: null },
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
