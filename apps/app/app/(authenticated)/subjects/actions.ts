"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const createSubject = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Subject name is required.");
  }

  await database.subject.create({
    data: {
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

  await database.subject.updateMany({
    where: { id: subjectId, organizationId: tenant.organizationId },
    data: {
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
