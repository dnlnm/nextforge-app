"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type SubjectCategory } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidCode, normalizeCode } from "@/lib/codes";
import {
  DEFAULT_SUBJECT_ICON,
  isSubjectCategoryValue,
  isSubjectIconKey,
} from "./subject-catalog";

interface SubjectActionState {
  error?: string;
}

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getCode = (formData: FormData): string | undefined => {
  const value = getString(formData, "code");
  const code = value ? normalizeCode(value) : undefined;

  return code && isValidCode(code) ? code : undefined;
};

const getCategory = (formData: FormData): SubjectCategory | undefined => {
  const value = getString(formData, "category");

  return value && isSubjectCategoryValue(value) ? value : undefined;
};

const getIcon = (formData: FormData): string | undefined => {
  const value = getString(formData, "icon");

  return value && isSubjectIconKey(value) ? value : undefined;
};

export const createSubject = async (
  formData: FormData
): Promise<SubjectActionState> => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");

  if (!name) {
    return { error: "Subject name is required." };
  }

  const code = getCode(formData);

  if (!code) {
    return { error: "Subject code must be 1-4 alphanumeric characters." };
  }

  const duplicate = await database.subject.findFirst({
    where: { organizationId: tenant.organizationId, code },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "A subject with this code already exists." };
  }

  await database.subject.create({
    data: {
      category: getCategory(formData) ?? "GENERAL",
      code,
      icon: getIcon(formData) ?? DEFAULT_SUBJECT_ICON,
      organizationId: tenant.organizationId,
      description: getString(formData, "description"),
      name,
    },
  });

  revalidatePath("/subjects");
  return {};
};

export const updateSubject = async (
  formData: FormData
): Promise<SubjectActionState> => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const subjectId = getString(formData, "subjectId");
  const name = getString(formData, "name");

  if (!subjectId) {
    return { error: "Subject is required." };
  }

  if (!name) {
    return { error: "Subject name is required." };
  }

  const code = getCode(formData);

  if (!code) {
    return { error: "Subject code must be 1-4 alphanumeric characters." };
  }

  const duplicate = await database.subject.findFirst({
    where: {
      organizationId: tenant.organizationId,
      code,
      NOT: { id: subjectId },
    },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "A subject with this code already exists." };
  }

  const category = getCategory(formData);
  const icon = getIcon(formData);

  await database.subject.updateMany({
    where: { id: subjectId, organizationId: tenant.organizationId },
    data: {
      ...(category ? { category } : {}),
      ...(icon ? { icon } : {}),
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
