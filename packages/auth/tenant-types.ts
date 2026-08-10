import type { TenantRole } from "./roles";

export interface TenantContext {
  readonly authOrganizationId: string;
  readonly authUserId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly role: TenantRole;
  readonly slug: string | null;
  readonly source: "active-organization" | "subdomain";
  readonly userId: string;
}