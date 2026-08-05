-- Add a photo URL field to the Student model so profile photos can be
-- stored (e.g. via Vercel Blob) and referenced.

ALTER TABLE "Student" ADD COLUMN "photoUrl" TEXT;
