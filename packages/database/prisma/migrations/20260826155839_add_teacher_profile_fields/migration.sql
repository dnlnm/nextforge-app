-- Add teacher profile fields: gender, qualification, salary, photo.
-- `qualification` is stored as free text; salary is integer sen.

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN "gender" "Gender";
ALTER TABLE "TeacherProfile" ADD COLUMN "qualification" TEXT;
ALTER TABLE "TeacherProfile" ADD COLUMN "salarySen" INTEGER;
ALTER TABLE "TeacherProfile" ADD COLUMN "photoKey" TEXT;
