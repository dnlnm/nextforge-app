-- Add a Gender enum and personal/contact fields to the Student model so the
-- Add Student form captures more than identity data.

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

ALTER TABLE "Student"
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "gender" "Gender",
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "postcode" TEXT;
