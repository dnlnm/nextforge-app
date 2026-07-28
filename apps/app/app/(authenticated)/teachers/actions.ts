"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const createTeacher = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const fullName = getString(formData, "fullName");

  if (!fullName) {
    throw new Error("Teacher name is required.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "teachers",
    userId: tenant.authUserId,
  });

  await database.teacherProfile.create({
    data: {
      organizationId: tenant.organizationId,
      email: getString(formData, "email"),
      fullName,
      phone: getString(formData, "phone"),
    },
  });

  revalidatePath("/teachers");
};

export const archiveTeacher = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const teacherId = getString(formData, "teacherId");

  if (!teacherId) {
    throw new Error("Teacher is required.");
  }

  await database.teacherProfile.updateMany({
    where: { id: teacherId, organizationId: tenant.organizationId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/teachers");
};
