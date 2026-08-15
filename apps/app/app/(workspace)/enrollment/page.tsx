import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../components/header";
import { EnrollmentCenter } from "./enrollment-center";

const EnrollmentPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [currency, students, classes, enrollments] = await Promise.all([
    getOrganizationCurrency(tenant.organizationId),
    database.student.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      select: {
        code: true,
        fullName: true,
        id: true,
        level: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    database.learningClass.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      include: {
        level: { select: { name: true } },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
          select: { dayOfWeek: true, endsAt: true, startsAt: true },
        },
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: { name: "asc" },
    }),
    database.enrollment.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
        student: { status: "ACTIVE", archivedAt: null },
      },
      include: {
        class: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
        student: { select: { fullName: true, id: true } },
      },
      orderBy: { student: { fullName: "asc" } },
    }),
  ]);

  const scheduleLabel = (
    schedules: Array<{
      readonly dayOfWeek: string;
      readonly endsAt: string;
      readonly startsAt: string;
    }>
  ) =>
    schedules.length > 0
      ? schedules
          .map(
            (schedule) =>
              `${schedule.dayOfWeek} ${schedule.startsAt}-${schedule.endsAt}`
          )
          .join(", ")
      : "No schedule";

  return (
    <>
      <Header page="Enrollment Center" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Enrollment Center
          </h1>
          <p className="text-muted-foreground text-sm">
            Enroll, bulk add, transfer, or end class enrollments from one
            screen.
          </p>
        </div>

        <EnrollmentCenter
          classes={classes.map((learningClass) => ({
            capacity: learningClass.capacity,
            code: learningClass.code,
            id: learningClass.id,
            levelName: learningClass.level?.name ?? null,
            monthlyFeeSen: learningClass.monthlyFeeSen,
            name: learningClass.name,
            scheduleLabel: scheduleLabel(learningClass.schedules),
            subjectName: learningClass.subject.name,
            teacherName: learningClass.teacher?.fullName ?? null,
          }))}
          currency={currency}
          enrollments={enrollments.map((enrollment) => ({
            className: enrollment.class.name,
            id: enrollment.id,
            studentId: enrollment.student.id,
            studentName: enrollment.student.fullName,
            subjectName: enrollment.class.subject.name,
          }))}
          students={students.map((student) => ({
            code: student.code,
            fullName: student.fullName,
            id: student.id,
            levelName: student.level?.name ?? null,
          }))}
        />
      </main>
    </>
  );
};

export default EnrollmentPage;
