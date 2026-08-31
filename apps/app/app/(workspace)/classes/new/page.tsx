import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { getAcademicYearOptions } from "@/lib/codes";
import { Header } from "../../components/header";
import { CreateClassForm } from "./create-class-form";

const CreateClassPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [subjects, teachers, levels, rooms, settings] = await Promise.all([
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ name: "asc" }],
      select: {
        code: true,
        id: true,
        name: true,
      },
    }),
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
      },
    }),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
      select: {
        code: true,
        id: true,
        name: true,
      },
    }),
    database.room.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      select: {
        capacity: true,
        id: true,
        name: true,
      },
    }),
    database.organizationSettings.findUnique({
      where: { organizationId: tenant.organizationId },
      select: { currency: true },
    }),
  ]);

  return (
    <>
      <Header
        page="Add New Class"
        pages={[`${appName}`, { href: "/classes", label: "Classes" }]}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Add New Class
          </h1>
          <p className="text-muted-foreground text-sm">
            Set up a new class and define its schedule, teacher and capacity.
          </p>
        </div>
        <CreateClassForm
          academicYearOptions={getAcademicYearOptions()}
          currency={settings?.currency ?? "MYR"}
          levels={levels}
          rooms={rooms}
          subjects={subjects}
          teachers={teachers}
        />
      </main>
    </>
  );
};

export default CreateClassPage;
