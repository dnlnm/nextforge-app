-- Assign a short, per-organization code to every subject, level, and class.
-- Subject/level codes are derived from the record name (first 4 alphanumerics,
-- uppercased, deduped with a numeric suffix). Class codes are built from the
-- subject code, level code, and the 2-digit academic year of creation.

ALTER TABLE "Subject" ADD COLUMN "code" TEXT;

WITH ranked AS (
  SELECT
    "id",
    "organizationId",
    left(upper(regexp_replace("name", '[^a-zA-Z0-9]', '', 'g')), 4) AS base_code,
    row_number() OVER (
      PARTITION BY "organizationId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Subject"
),
deduped AS (
  SELECT
    "id",
    "base_code",
    row_number() OVER (
      PARTITION BY "organizationId", "base_code"
      ORDER BY "rn"
    ) AS occurrence
  FROM ranked
)
UPDATE "Subject" s
SET "code" = CASE
  WHEN d."base_code" = '' THEN 'SUB' || LPAD(d."occurrence"::TEXT, 1, '0')
  WHEN d."occurrence" = 1 THEN d."base_code"
  ELSE left(d."base_code", 3) || d."occurrence"::TEXT
END
FROM deduped d
WHERE s."id" = d."id";

ALTER TABLE "Subject" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Subject_organizationId_code_key" ON "Subject"("organizationId", "code");

ALTER TABLE "Level" ADD COLUMN "code" TEXT;

WITH ranked AS (
  SELECT
    "id",
    "organizationId",
    left(upper(regexp_replace("name", '[^a-zA-Z0-9]', '', 'g')), 4) AS base_code,
    row_number() OVER (
      PARTITION BY "organizationId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Level"
),
deduped AS (
  SELECT
    "id",
    "base_code",
    row_number() OVER (
      PARTITION BY "organizationId", "base_code"
      ORDER BY "rn"
    ) AS occurrence
  FROM ranked
)
UPDATE "Level" l
SET "code" = CASE
  WHEN d."base_code" = '' THEN 'LVL' || LPAD(d."occurrence"::TEXT, 1, '0')
  WHEN d."occurrence" = 1 THEN d."base_code"
  ELSE left(d."base_code", 3) || d."occurrence"::TEXT
END
FROM deduped d
WHERE l."id" = d."id";

ALTER TABLE "Level" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Level_organizationId_code_key" ON "Level"("organizationId", "code") WHERE "archivedAt" IS NULL;

ALTER TABLE "LearningClass" ADD COLUMN "code" TEXT;
ALTER TABLE "LearningClass" ADD COLUMN "academicYear" INTEGER;

WITH ranked AS (
  SELECT
    lc."id",
    lc."organizationId",
    lc."createdAt",
    s."code" AS subject_code,
    COALESCE(l."code", 'GEN') AS level_code,
    row_number() OVER (
      PARTITION BY lc."organizationId"
      ORDER BY lc."createdAt", lc."id"
    ) AS rn
  FROM "LearningClass" lc
  LEFT JOIN "Subject" s ON s."id" = lc."subjectId"
  LEFT JOIN "Level" l ON l."id" = lc."levelId"
),
deduped AS (
  SELECT
    "id",
    "createdAt",
    "subject_code",
    "level_code",
    row_number() OVER (
      PARTITION BY "organizationId", "subject_code", "level_code"
      ORDER BY "rn"
    ) AS occurrence
  FROM ranked
)
UPDATE "LearningClass" lc
SET
  "academicYear" = EXTRACT(YEAR FROM d."createdAt")::INTEGER,
  "code" = d."subject_code" || '-' || d."level_code" || '-' ||
    LPAD((EXTRACT(YEAR FROM d."createdAt") % 100)::TEXT, 2, '0') ||
    CASE WHEN d."occurrence" > 1 THEN '-' || d."occurrence"::TEXT ELSE '' END
FROM deduped d
WHERE lc."id" = d."id";

ALTER TABLE "LearningClass" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "LearningClass" ALTER COLUMN "academicYear" SET NOT NULL;

CREATE UNIQUE INDEX "LearningClass_organizationId_code_key" ON "LearningClass"("organizationId", "code");
