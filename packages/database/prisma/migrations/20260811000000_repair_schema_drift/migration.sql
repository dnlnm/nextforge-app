-- Repair schema drift between the migration history and schema.prisma.
--
-- Several tables and columns were introduced directly to schema.prisma and applied
-- to live environments with `prisma db push`, so they never exist in a fresh
-- `prisma migrate deploy`. This migration reconciles the history with the schema:
--
--   1. Creates the missing tables (Room, ClassSchedule, ReservedSlug) and the
--      RoomStatus enum.
--   2. Adds columns declared by the schema but never migrated (Student.levelId,
--      LearningClass.levelId / startsOn / endsOn).
--   3. Drops columns and indexes that exist in the history but no longer in the
--      schema (Student.academicLevel, Subject.academicLevel, LearningClass legacy
--      inline schedule fields).
--   4. Restores the unique index on Subject(organizationId, name), which was
--      replaced in the schema by a plain name unique.

-- 1. RoomStatus enum (declared by the schema, never created in the history).
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- 2. Create the missing tables.

CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "location" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,
    "roomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservedSlug" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservedSlug_pkey" PRIMARY KEY ("id")
);

-- 3. Add columns declared by the schema but missing from the history.

ALTER TABLE "Student" ADD COLUMN "levelId" TEXT;
ALTER TABLE "LearningClass" ADD COLUMN "levelId" TEXT;
ALTER TABLE "LearningClass" ADD COLUMN "startsOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LearningClass" ADD COLUMN "endsOn" TIMESTAMP(3);

-- 4. Drop stale columns and indexes that no longer exist in the schema.

DROP INDEX IF EXISTS "LearningClass_organizationId_dayOfWeek_idx";
DROP INDEX IF EXISTS "Subject_organizationId_name_academicLevel_key";

ALTER TABLE "LearningClass" DROP COLUMN IF EXISTS "dayOfWeek";
ALTER TABLE "LearningClass" DROP COLUMN IF EXISTS "startsAt";
ALTER TABLE "LearningClass" DROP COLUMN IF EXISTS "endsAt";
ALTER TABLE "LearningClass" DROP COLUMN IF EXISTS "room";
ALTER TABLE "Subject" DROP COLUMN IF EXISTS "academicLevel";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "academicLevel";

-- 5. Indexes expected by the schema.

CREATE INDEX "Room_organizationId_status_idx" ON "Room"("organizationId", "status");

-- Enforce "one account owns at most one tuition centre" at the database level:
-- at most one ACTIVE OWNER membership per user.
CREATE UNIQUE INDEX "OrganizationMembership_userId_key" ON "OrganizationMembership"("userId") WHERE ("role" = 'OWNER' AND "status" = 'ACTIVE');
CREATE UNIQUE INDEX "Room_organizationId_name_key" ON "Room"("organizationId", "name");
CREATE UNIQUE INDEX "ReservedSlug_slug_key" ON "ReservedSlug"("slug");
CREATE INDEX "ClassSchedule_classId_idx" ON "ClassSchedule"("classId");
CREATE INDEX "ClassSchedule_roomId_idx" ON "ClassSchedule"("roomId");
CREATE INDEX "ClassSchedule_dayOfWeek_idx" ON "ClassSchedule"("dayOfWeek");
CREATE UNIQUE INDEX "ClassSchedule_classId_dayOfWeek_key" ON "ClassSchedule"("classId", "dayOfWeek");

-- Subject(organizationId, name) unique; previously part of the dropped
-- (organizationId, name, academicLevel) composite index.
CREATE UNIQUE INDEX "Subject_organizationId_name_key" ON "Subject"("organizationId", "name");

-- 6. Foreign keys.

ALTER TABLE "Room" ADD CONSTRAINT "Room_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Student" ADD CONSTRAINT "Student_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LearningClass" ADD CONSTRAINT "LearningClass_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LearningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
