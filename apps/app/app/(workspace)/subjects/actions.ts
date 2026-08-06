"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidCode, normalizeCode } from "@/lib/codes";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getCode = (formData: FormData) => {
  const value = getString(formData, "code");
  const code = value ? normalizeCode(value) : undefined;

  if (!(code && isValidCode(code))) {
    throw new Error("Subject code must be 1-4 alphanumeric characters.");
  }

  return code;
};

export const createSubject = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Subject name is required.");
  }

  const code = getCode(formData);
  const duplicate = await database.subject.findFirst({
    where: { organizationId: tenant.organizationId, code },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A subject with this code already exists.");
  }

  await database.subject.create({
    data: {
      code,
      organizationId: tenant.organizationId,
      description: getString(formData, "description"),
      name,
    },
  });

  revalidatePath("/subjects");
};

export const updateSubject = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const subjectId = getString(formData, "subjectId");
  const name = getString(formData, "name");

  if (!(subjectId && name)) {
    throw new Error("Subject is required.");
  }

  const code = getCode(formData);
  const duplicate = await database.subject.findFirst({
    where: {
      organizationId: tenant.organizationId,
      code,
      NOT: { id: subjectId },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A subject with this code already exists.");
  }

  await database.subject.updateMany({
    where: { id: subjectId, organizationId: tenant.organizationId },
    data: {
      code,
      description: getString(formData, "description"),
      name,
    },
  });

  revalidatePath("/subjects");
  revalidatePath("/subjects/[subjectId]", "page");
  redirect(`/subjects/${subjectId}`);
};

export const archiveSubject = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const subjectId = getString(formData, "subjectId");

  if (!subjectId) {
    throw new Error("Subject is required.");
  }

  await database.subject.updateMany({
    where: { id: subjectId, organizationId: tenant.organizationId },
    data: { archivedAt: new Date(), status: "ARCHIVED" },
  });

  revalidatePath("/subjects");
  revalidatePath("/subjects/[subjectId]", "page");
  redirect("/subjects");
};
