-- CreateEnum
CREATE TYPE "TeacherEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE');

-- CreateEnum
CREATE TYPE "TeacherRole" AS ENUM ('TEACHER', 'SENIOR_TEACHER', 'ACADEMIC_COORDINATOR');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "employmentType" "TeacherEmploymentType",
ADD COLUMN     "hourlyRateSen" INTEGER,
ADD COLUMN     "icNumber" TEXT,
ADD COLUMN     "primarySubject" TEXT,
ADD COLUMN     "role" "TeacherRole",
ADD COLUMN     "status" "TeacherStatus",
ADD COLUMN     "teachingLevel" "LevelStage";
