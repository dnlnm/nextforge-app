-- Add the AdminInvitation table to back the invite-based admin flow
-- (email link -> accept -> become an ADMIN member). Mirrors TeacherInvitation.
--
-- Environments synced via `prisma db push` may already have the table, so this
-- migration is idempotent: it only creates objects that are missing.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus'
  ) THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminInvitation" (
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

  CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- Allows at most one pending invitation per (organization, email).
CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvitation_organizationId_email_status_key"
  ON "AdminInvitation"("organizationId", "email", "status");

CREATE INDEX IF NOT EXISTS "AdminInvitation_email_status_idx"
  ON "AdminInvitation"("email", "status");

CREATE INDEX IF NOT EXISTS "AdminInvitation_expiresAt_idx"
  ON "AdminInvitation"("expiresAt");

CREATE INDEX IF NOT EXISTS "AdminInvitation_organizationId_status_idx"
  ON "AdminInvitation"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "AdminInvitation_token_status_idx"
  ON "AdminInvitation"("token", "status");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AdminInvitation_organizationId_fkey'
  ) THEN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AdminInvitation_invitedByUserId_fkey'
  ) THEN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedByUserId_fkey"
      FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AdminInvitation_acceptedByUserId_fkey'
  ) THEN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_acceptedByUserId_fkey"
      FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
