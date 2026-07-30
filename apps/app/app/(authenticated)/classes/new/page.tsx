import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Header } from "../../components/header";
import { CreateClassForm } from "./create-class-form";

const CreateClassPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [subjects, teachers] = await Promise.all([
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ academicLevel: "asc" }, { name: "asc" }],
      select: {
        id: true,
        academicLevel: true,
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
  ]);

  return (
    <>
      <Header
        page="Add New Class"
        pages={["TLAS.MY", { href: "/classes", label: "Classes" }]}
      />
      <main className="grid gap-5 p-4 pt-4 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end xl:col-span-full">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Add New Class
            </h1>
            <p className="text-muted-foreground text-sm">
              Set up a new tuition class with schedule, subject, and teacher.
            </p>
          </div>
        </div>
        <CreateClassForm subjects={subjects} teachers={teachers} />
      </main>
    </>
  );
};

export default CreateClassPage;
