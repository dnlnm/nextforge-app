/*
  Warnings:

  - You are about to drop the column `primarySubject` on the `TeacherProfile` table. All the data in the column will be lost.
  - You are about to drop the column `teachingLevel` on the `TeacherProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeacherProfile" DROP COLUMN "primarySubject",
DROP COLUMN "teachingLevel";
