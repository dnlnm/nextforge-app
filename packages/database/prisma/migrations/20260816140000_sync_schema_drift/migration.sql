-- Sync schema.prisma with the live database: TeacherProfile.userId with its
-- foreign key, partial unique indexes for active enrollments / owners /
-- invitation tokens, unique organization slugs, and dropped defaults.
-- Without these, queries that include TeacherProfile (e.g. the dashboard
-- class session list) fail with P2022 "column does not exist".

-- DropIndex
DROP INDEX "Enrollment_studentId_classId_key";

-- DropIndex
DROP INDEX "OrganizationMembership_userId_key";

-- AlterTable
ALTER TABLE "LearningClass" ALTER COLUMN "startsOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_token_key" ON "AdminInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId") WHERE ("status" = 'ACTIVE');

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_key" ON "OrganizationMembership"("userId") WHERE ("role" = 'OWNER' AND "status" = 'ACTIVE');

-- CreateIndex
CREATE UNIQUE INDEX "TeacherInvitation_token_key" ON "TeacherInvitation"("token");

-- CreateIndex
CREATE INDEX "TeacherProfile_userId_idx" ON "TeacherProfile"("userId");

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;