import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Header } from "../../components/header";
import { getNextStudentCode } from "../actions";
import { StudentCreateForm } from "../components/student-create-form";

const AddStudentPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const [nextCode, levels, settings, classes] = await Promise.all([
    getNextStudentCode(),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, stage: true },
    }),
    database.organizationSettings.findUnique({
      where: { organizationId: tenant.organizationId },
      select: { currency: true },
    }),
    database.learningClass.findMany({
      where: {
        organizationId: tenant.organizationId,
        archivedAt: null,
        status: "ACTIVE",
      },
      orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        monthlyFeeSen: true,
        capacity: true,
        levelId: true,
        subject: { select: { name: true } },
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE", archivedAt: null } },
          },
        },
      },
    }),
  ]);

  return (
    <>
      <Header
        page="Add Student"
        pages={[`${appName}`, { href: "/students", label: "Students" }]}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Add Student</h1>
          <p className="text-muted-foreground text-sm">
            Register a new student and their parent/guardian details.
          </p>
        </div>

        <StudentCreateForm
          nextCode={nextCode}
          classes={classes.map((learningClass) => ({
            activeEnrollmentCount: learningClass._count.enrollments,
            capacity: learningClass.capacity,
            code: learningClass.code,
            id: learningClass.id,
            levelId: learningClass.levelId,
            monthlyFeeSen: learningClass.monthlyFeeSen,
            name: learningClass.name,
            subjectName: learningClass.subject.name,
          }))}
          currency={settings?.currency ?? "MYR"}
          levels={levels}
        />
      </main>
    </>
  );
};

export default AddStudentPage;
