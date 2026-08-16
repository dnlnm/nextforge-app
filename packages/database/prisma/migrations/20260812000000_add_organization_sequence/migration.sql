-- Create "OrganizationSequence" table
-- Per-organization monotonic counters used to generate sequential
-- human-facing numbers (invoice numbers, receipt numbers). Replaces the
-- race-prone `count(...) + 1` numbering scheme.

CREATE TABLE "OrganizationSequence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganizationSequence_pkey" PRIMARY KEY ("id")
);

-- Unique per (organization, kind) so the upsert-increment in
-- `reserveNextSequence` is race-safe.
CREATE UNIQUE INDEX "OrganizationSequence_organizationId_kind_key" ON "OrganizationSequence"("organizationId", "kind");

-- FK lookups and cascade delete with the owning organization.
CREATE INDEX "OrganizationSequence_organizationId_idx" ON "OrganizationSequence"("organizationId");

-- Add foreign key constraint with CASCADE delete on organization removal.
ALTER TABLE "OrganizationSequence"
    ADD CONSTRAINT "OrganizationSequence_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
