"use client";

import { createContext, type ReactNode, useContext } from "react";

type OrganizationRole = "TEACHER" | "ADMIN" | "OWNER";

type OrganizationContextValue = {
  readonly imageUrl: string | null;
  readonly name: string;
  readonly role: OrganizationRole;
} | null;

const OrganizationContext = createContext<OrganizationContextValue>(null);

interface OrganizationProviderProperties {
  readonly children: ReactNode;
  readonly organization: OrganizationContextValue;
}

export const OrganizationProvider = ({
  children,
  organization,
}: OrganizationProviderProperties) => (
  <OrganizationContext.Provider value={organization}>
    {children}
  </OrganizationContext.Provider>
);

export const useOrganization = () => useContext(OrganizationContext);
