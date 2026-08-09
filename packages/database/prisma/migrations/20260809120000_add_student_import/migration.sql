ALTER TABLE "Organization" ADD COLUMN "studentCodeSequence" INTEGER NOT NULL DEFAULT 0;

UPDATE "Organization" AS organization
SET "studentCodeSequence" = COALESCE(codes.max_sequence, 0)
FROM (
  SELECT "organizationId", MAX(
    CASE
      WHEN "code" ~ '^STU[0-9]+$' THEN SUBSTRING("code" FROM 4)::INTEGER
      ELSE 0
    END
  ) AS max_sequence
  FROM "Student"
  GROUP BY "organizationId"
) AS codes
WHERE organization.id = codes."organizationId";

CREATE TYPE "StudentImportStatus" AS ENUM (
  'UPLOADED',
  'VALIDATING',
  'READY',
  'PROCESSING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED'
);

CREATE TYPE "StudentImportRowStatus" AS ENUM (
  'VALID',
  'INVALID',
  'DUPLICATE',
  'PROCESSING',
  'CREATED',
  'FAILED'
);

CREATE TABLE "StudentImport" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "sourceKey" TEXT,
  "status" "StudentImportStatus" NOT NULL DEFAULT 'UPLOADED',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0,
  "skippedRows" INTEGER NOT NULL DEFAULT 0,
  "processedRows" INTEGER NOT NULL DEFAULT 0,
  "createdRows" INTEGER NOT NULL DEFAULT 0,
  "failureMessage" TEXT,
  "validationStartedAt" TIMESTAMP(3),
  "validatedAt" TIMESTAMP(3),
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentImportRow" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "status" "StudentImportRowStatus" NOT NULL,
  "rawData" JSONB NOT NULL,
  "normalizedData" JSONB,
  "errors" JSONB NOT NULL,
  "fingerprint" TEXT,
  "createdStudentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentImportRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentImport_organizationId_createdAt_idx" ON "StudentImport"("organizationId", "createdAt");
CREATE INDEX "StudentImport_organizationId_status_idx" ON "StudentImport"("organizationId", "status");
CREATE UNIQUE INDEX "StudentImportRow_importId_rowNumber_key" ON "StudentImportRow"("importId", "rowNumber");
CREATE INDEX "StudentImportRow_organizationId_importId_idx" ON "StudentImportRow"("organizationId", "importId");
CREATE INDEX "StudentImportRow_importId_status_idx" ON "StudentImportRow"("importId", "status");

ALTER TABLE "StudentImport" ADD CONSTRAINT "StudentImport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentImport" ADD CONSTRAINT "StudentImport_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentImportRow" ADD CONSTRAINT "StudentImportRow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentImportRow" ADD CONSTRAINT "StudentImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "StudentImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentImportRow" ADD CONSTRAINT "StudentImportRow_createdStudentId_fkey" FOREIGN KEY ("createdStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
