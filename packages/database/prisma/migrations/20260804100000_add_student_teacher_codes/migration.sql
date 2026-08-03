-- Assign a permanent, sequential per-organization code to every student and
-- teacher. Codes are never reused (archived records keep theirs) and are unique
-- per organization.

ALTER TABLE "Student" ADD COLUMN "code" TEXT;

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "organizationId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Student"
)
UPDATE "Student" s
SET "code" = 'STU' || LPAD(ranked.rn::TEXT, 4, '0')
FROM ranked
WHERE s."id" = ranked."id";

ALTER TABLE "Student" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Student_organizationId_code_key" ON "Student"("organizationId", "code");

ALTER TABLE "TeacherProfile" ADD COLUMN "code" TEXT;

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "organizationId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "TeacherProfile"
)
UPDATE "TeacherProfile" t
SET "code" = 'TCH' || LPAD(ranked.rn::TEXT, 4, '0')
FROM ranked
WHERE t."id" = ranked."id";

ALTER TABLE "TeacherProfile" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "TeacherProfile_organizationId_code_key" ON "TeacherProfile"("organizationId", "code");
