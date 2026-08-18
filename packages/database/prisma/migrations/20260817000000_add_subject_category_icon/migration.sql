-- Add subject category and display icon.
-- Existing subjects fall back to GENERAL and the default book-open icon;
-- admins can update them via the subject edit form.

CREATE TYPE "SubjectCategory" AS ENUM ('MATHEMATICS', 'SCIENCE', 'LANGUAGES', 'ARTS', 'GENERAL');

ALTER TABLE "Subject" ADD COLUMN "category" "SubjectCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Subject" ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'book-open';