-- Rename the application user identity to reflect Supabase Auth.
ALTER TABLE "User" RENAME COLUMN "clerkUserId" TO "authUserId";
ALTER INDEX "User_clerkUserId_key" RENAME TO "User_authUserId_key";

-- Organizations are application-managed and no longer require a Clerk ID.
DROP INDEX "Organization_clerkOrganizationId_key";
ALTER TABLE "Organization" DROP COLUMN "clerkOrganizationId";

-- Memberships may optionally retain a provider-side external identifier.
ALTER TABLE "OrganizationMembership" RENAME COLUMN "clerkMembershipId" TO "externalId";
ALTER TABLE "OrganizationMembership" ALTER COLUMN "externalId" DROP NOT NULL;
ALTER INDEX "OrganizationMembership_clerkMembershipId_key"
  RENAME TO "OrganizationMembership_externalId_key";
