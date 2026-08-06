-- Ensure each organization keeps exactly one branch.
-- Prefer the default branch, then the oldest branch, then the lowest id.
WITH ranked_branches AS (
  SELECT
    id,
    "organizationId",
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId"
      ORDER BY "isDefault" DESC, "createdAt" ASC, id ASC
    ) AS row_number
  FROM "Branch"
),
surviving_branches AS (
  SELECT id, "organizationId"
  FROM ranked_branches
  WHERE row_number = 1
)
UPDATE "Student" student
SET "branchId" = surviving_branches.id
FROM surviving_branches
WHERE student."organizationId" = surviving_branches."organizationId"
  AND (student."branchId" IS NULL OR student."branchId" <> surviving_branches.id);

WITH ranked_branches AS (
  SELECT
    id,
    "organizationId",
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId"
      ORDER BY "isDefault" DESC, "createdAt" ASC, id ASC
    ) AS row_number
  FROM "Branch"
),
surviving_branches AS (
  SELECT id, "organizationId"
  FROM ranked_branches
  WHERE row_number = 1
)
UPDATE "TeacherProfile" teacher
SET "branchId" = surviving_branches.id
FROM surviving_branches
WHERE teacher."organizationId" = surviving_branches."organizationId"
  AND (teacher."branchId" IS NULL OR teacher."branchId" <> surviving_branches.id);

WITH ranked_branches AS (
  SELECT
    id,
    "organizationId",
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId"
      ORDER BY "isDefault" DESC, "createdAt" ASC, id ASC
    ) AS row_number
  FROM "Branch"
),
surviving_branches AS (
  SELECT id, "organizationId"
  FROM ranked_branches
  WHERE row_number = 1
)
UPDATE "LearningClass" learning_class
SET "branchId" = surviving_branches.id
FROM surviving_branches
WHERE learning_class."organizationId" = surviving_branches."organizationId"
  AND (learning_class."branchId" IS NULL OR learning_class."branchId" <> surviving_branches.id);

DELETE FROM "Branch"
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "organizationId"
        ORDER BY "isDefault" DESC, "createdAt" ASC, id ASC
      ) AS row_number
    FROM "Branch"
  ) ranked_branches
  WHERE row_number > 1
);

UPDATE "Branch"
SET "isDefault" = true;

DROP INDEX IF EXISTS "Branch_organizationId_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_organizationId_key" ON "Branch"("organizationId");
