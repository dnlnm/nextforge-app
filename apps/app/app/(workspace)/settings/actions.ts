"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { refresh, revalidatePath } from "next/cache";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getDueDay = (formData: FormData) => {
  const value = Number.parseInt(
    getString(formData, "defaultInvoiceDueDay") ?? "7",
    10
  );

  if (Number.isNaN(value)) {
    return 7;
  }

  return Math.min(Math.max(value, 1), 28);
};

export const updateCentreSettings = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");

  if (!name) {
    throw new Error("Centre name is required.");
  }

  await database.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: tenant.organizationId },
      data: { imageUrl: getString(formData, "imageUrl"), name },
    });
    await tx.organizationSettings.upsert({
      where: { organizationId: tenant.organizationId },
      create: {
        organizationId: tenant.organizationId,
        addressLine1: getString(formData, "addressLine1"),
        addressLine2: getString(formData, "addressLine2"),
        city: getString(formData, "city"),
        defaultInvoiceDueDay: getDueDay(formData),
        email: getString(formData, "email"),
        invoicePrefix: getString(formData, "invoicePrefix") ?? "INV",
        paymentInstructions: getString(formData, "paymentInstructions"),
        phone: getString(formData, "phone"),
        postcode: getString(formData, "postcode"),
        receiptPrefix: getString(formData, "receiptPrefix") ?? "RCP",
        state: getString(formData, "state"),
      },
      update: {
        addressLine1: getString(formData, "addressLine1"),
        addressLine2: getString(formData, "addressLine2"),
        city: getString(formData, "city"),
        defaultInvoiceDueDay: getDueDay(formData),
        email: getString(formData, "email"),
        invoicePrefix: getString(formData, "invoicePrefix") ?? "INV",
        paymentInstructions: getString(formData, "paymentInstructions"),
        phone: getString(formData, "phone"),
        postcode: getString(formData, "postcode"),
        receiptPrefix: getString(formData, "receiptPrefix") ?? "RCP",
        state: getString(formData, "state"),
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/api/organization-logo");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  refresh();
};
