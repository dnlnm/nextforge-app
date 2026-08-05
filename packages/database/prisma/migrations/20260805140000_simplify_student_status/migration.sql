-- Collapse the StudentStatus enum to a clean Active/Archived binary.
-- INACTIVE and GRADUATED were never written by any application code (only
-- ACTIVE rows exist), so they are dropped safely by recreating the type.
-- A student that is not active is archived.

ALTER TABLE "Student" ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "StudentStatus" RENAME TO "StudentStatusOld";

CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

ALTER TABLE "Student"
  ALTER COLUMN "status" TYPE "StudentStatus"
  USING ("status"::text::"StudentStatus");

DROP TYPE "StudentStatusOld";

ALTER TABLE "Student" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
