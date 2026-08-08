import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Header } from "../../components/header";
import { getNextStudentCode } from "../actions";
import { StudentCreateForm } from "../components/student-create-form";

const AddStudentPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const [nextCode, levels] = await Promise.all([
    getNextStudentCode(),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <Header
        page="Add Student"
        pages={[`${appName}`, { href: "/students", label: "Students" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Add Student
            </h1>
            <p className="text-muted-foreground text-sm">
              Capture student and guardian details in one place.
            </p>
          </div>
        </div>

        <StudentCreateForm levels={levels} nextCode={nextCode} />
      </main>
    </>
  );
};

export default AddStudentPage;
