-- Create the LevelStage enum used to group academic levels by education stage.
CREATE TYPE "LevelStage" AS ENUM ('PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY', 'PRE_UNIVERSITY', 'GENERAL');

-- Add the stage column to the Level table.
ALTER TABLE "Level" ADD COLUMN "stage" "LevelStage" NOT NULL DEFAULT 'GENERAL';

-- Backfill existing levels based on their name.
UPDATE "Level"
SET "stage" = CASE
  WHEN "name" ~* '^Year [1-6]$' THEN 'PRIMARY'::"LevelStage"
  WHEN "name" ~* '^Form [1-3]$' THEN 'LOWER_SECONDARY'::"LevelStage"
  WHEN "name" ~* '^Form [4-5]$' THEN 'UPPER_SECONDARY'::"LevelStage"
  WHEN "name" ~* '^(Form 6|STPM|Matriculation|Foundation|A[ -]?Levels?|Diploma)$' THEN 'PRE_UNIVERSITY'::"LevelStage"
  ELSE 'GENERAL'::"LevelStage"
END;
