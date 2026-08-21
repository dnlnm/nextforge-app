-- Recreate the two partial unique indexes so their stored definitions match
-- what Prisma Migrate expects (schema.prisma). The existing indexes are
-- semantically identical but were created with different literal formatting,
-- which Prisma's differ reports as schema drift.
DROP INDEX "Enrollment_studentId_classId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId") WHERE ("status" = 'ACTIVE');

DROP INDEX "OrganizationMembership_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_key" ON "OrganizationMembership"("userId") WHERE ("role" = 'OWNER' AND "status" = 'ACTIVE');
