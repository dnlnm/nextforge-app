"use server";

import {
  createOrganization as createOrganizationInAuth,
  getOrganizations as getOrganizationsInAuth,
  switchOrganization as switchOrganizationInAuth,
} from "@repo/auth/organizations";

export const createOrganization = async (name: string) =>
  createOrganizationInAuth(name);

export const getOrganizations = async () => getOrganizationsInAuth();

export const switchOrganization = async (organizationId: string) =>
  switchOrganizationInAuth(organizationId);
