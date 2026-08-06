-- Add the TeacherInvitation table and InvitationStatus enum to back the
-- invite-based teacher flow (email link -> accept -> become a TEACHER member).
--
-- The enum/table were previously pushed to some environments manually, so this
-- migration is idempotent: it only creates objects that are missing and adds
-- the `fullName` column introduced alongside this migration.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus'
  ) THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TeacherInvitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invitedByUserId" TEXT,
  "acceptedByUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "TeacherInvitation_pkey" PRIMARY KEY ("id")
);

-- Bring an environment where the table was pushed without this column up to date.
ALTER TABLE "TeacherInvitation" ADD COLUMN IF NOT EXISTS "fullName" TEXT;

-- Allows at most one pending invitation per (organization, email).
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherInvitation_organizationId_email_status_key"
  ON "TeacherInvitation"("organizationId", "email", "status");

CREATE INDEX IF NOT EXISTS "TeacherInvitation_email_status_idx"
  ON "TeacherInvitation"("email", "status");

CREATE INDEX IF NOT EXISTS "TeacherInvitation_expiresAt_idx"
  ON "TeacherInvitation"("expiresAt");

CREATE INDEX IF NOT EXISTS "TeacherInvitation_organizationId_status_idx"
  ON "TeacherInvitation"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "TeacherInvitation_token_status_idx"
  ON "TeacherInvitation"("token", "status");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherInvitation_organizationId_fkey'
  ) THEN
    ALTER TABLE "TeacherInvitation" ADD CONSTRAINT "TeacherInvitation_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherInvitation_invitedByUserId_fkey'
  ) THEN
    ALTER TABLE "TeacherInvitation" ADD CONSTRAINT "TeacherInvitation_invitedByUserId_fkey"
      FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherInvitation_acceptedByUserId_fkey'
  ) THEN
    ALTER TABLE "TeacherInvitation" ADD CONSTRAINT "TeacherInvitation_acceptedByUserId_fkey"
      FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;