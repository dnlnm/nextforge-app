-- Replace the (studentId, classId, status) unique constraint with a partial
-- unique that only applies to ACTIVE enrollments.
--
-- The old constraint prevented a student from having two ACTIVE enrollments in a
-- class (good) but also threw on a second ENDED/ARCHIVED row for the same
-- student+class (bad): a student who was un-enrolled and later re-enrolled then
-- un-enrolled again would hit a unique collision. The partial index keeps the
-- "no duplicate active enrolment" guarantee while allowing history rows to accrue.

DROP INDEX IF EXISTS "Enrollment_studentId_classId_status_key";

CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId") WHERE ("status" = 'ACTIVE');
