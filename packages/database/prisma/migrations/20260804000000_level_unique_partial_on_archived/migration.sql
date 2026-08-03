-- Replace the full (organizationId, name) unique constraint on Level with a partial
-- unique index that only applies to active (non-archived) levels. This allows an
-- archived level to be re-created under the same name.
DROP INDEX "Level_organizationId_name_key";

CREATE UNIQUE INDEX "Level_organizationId_name_key" ON "Level"("organizationId", "name") WHERE ("archivedAt" IS NULL);
