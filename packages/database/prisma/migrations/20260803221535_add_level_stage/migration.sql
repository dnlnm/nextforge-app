-- Create the LevelStage enum used to group academic levels by education stage.
CREATE TYPE "LevelStage" AS ENUM ('PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY', 'PRE_UNIVERSITY', 'GENERAL');

-- The Level table was applied to live environments via `prisma db push` but never
-- existed in the migration history, so this migration previously failed on a fresh
-- database. Create the table here so `prisma migrate deploy` produces the schema.
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "LevelStage" NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- Backfill existing levels based on their name.
UPDATE "Level"
SET "stage" = CASE
  WHEN "name" ~* '^Year [1-6]$' THEN 'PRIMARY'::"LevelStage"
  WHEN "name" ~* '^Form [1-3]$' THEN 'LOWER_SECONDARY'::"LevelStage"
  WHEN "name" ~* '^Form [4-5]$' THEN 'UPPER_SECONDARY'::"LevelStage"
  WHEN "name" ~* '^(Form 6|STPM|Matriculation|Foundation|A[ -]?Levels?|Diploma)$' THEN 'PRE_UNIVERSITY'::"LevelStage"
  ELSE 'GENERAL'::"LevelStage"
END;

-- Constraints and indexes expected by the schema.
ALTER TABLE "Level" ADD CONSTRAINT "Level_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Level_organizationId_archivedAt_idx" ON "Level"("organizationId", "archivedAt");

-- Full unique on (organizationId, name); converted to a partial unique later by
-- 20260804000000_level_unique_partial_on_archived.
CREATE UNIQUE INDEX "Level_organizationId_name_key" ON "Level"("organizationId", "name");
