/*
  Warnings:

  - You are about to drop the column `role` on the `TeacherProfile` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TeacherProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeacherProfile" DROP COLUMN "role",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "TeacherRole";

-- DropEnum
DROP TYPE "TeacherStatus";
