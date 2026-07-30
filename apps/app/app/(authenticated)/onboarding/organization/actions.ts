"use server";

import {
  createOrganization as createOrganizationInAuth,
  getOrganizations as getOrganizationsInAuth,
  switchOrganization as switchOrganizationInAuth,
} from "@repo/auth/organizations";
import { redirect } from "next/navigation";

const normalizeName = (value: string) => value.trim();

export const createOrganization = async (
  nameValue: string,
  imageUrl?: string
) => {
  const name = normalizeName(nameValue);

  if (!name) {
    throw new Error("Centre name is required.");
  }

  await createOrganizationInAuth(name, imageUrl);
  redirect("/");
};

export const getOrganizations = async () => getOrganizationsInAuth();

export const switchOrganization = async (organizationId: string) =>
  switchOrganizationInAuth(organizationId);
