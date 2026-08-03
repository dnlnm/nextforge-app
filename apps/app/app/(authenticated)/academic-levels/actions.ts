"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type LevelStage } from "@repo/database";
import { revalidatePath } from "next/cache";
import { isValidCode, normalizeCode } from "@/lib/codes";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getCode = (formData: FormData) => {
  const value = getString(formData, "code");
  const code = value ? normalizeCode(value) : undefined;

  if (!(code && isValidCode(code))) {
    throw new Error("Level code must be 1-4 alphanumeric characters.");
  }

  return code;
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
    select: { code: true, id: true, name: true, order: true, stage: true },
  });
};

export const createLevel = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");
  const stage = getStage(formData);
  const code = getCode(formData);

  if (!name) {
    throw new Error("Level name is required.");
  }

  const existing = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      OR: [{ code }, { name }],
      archivedAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A level with this name or code already exists.");
  }

  const counts = await database.level.aggregate({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    _max: { order: true },
  });

  await database.level.create({
    data: {
      code,
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
  const code = getCode(formData);

  if (!(levelId && name)) {
    throw new Error("Level is required.");
  }

  const duplicate = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      archivedAt: null,
      NOT: { id: levelId },
      OR: [{ code }, { name }],
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A level with this name or code already exists.");
  }

  await database.level.updateMany({
    where: { id: levelId, organizationId: tenant.organizationId },
    data: { code, name, stage },
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
    select: { archivedAt: true, code: true, name: true },
  });

  if (!archived?.archivedAt) {
    throw new Error("Level not found or not archived.");
  }

  const active = await database.level.findFirst({
    where: {
      organizationId: tenant.organizationId,
      archivedAt: null,
      OR: [{ code: archived.code }, { name: archived.name }],
    },
    select: { id: true },
  });

  if (active) {
    throw new Error("A level with this name or code already exists.");
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
