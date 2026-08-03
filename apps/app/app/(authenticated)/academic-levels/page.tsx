import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Header } from "../components/header";
import { AcademicLevelsList } from "./academic-levels-list";

const AcademicLevelsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const levels = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      _count: {
        select: {
          classes: { where: { archivedAt: null } },
          students: { where: { archivedAt: null } },
        },
      },
    },
  });

  return (
    <>
      <Header page="Academic Levels" pages={["TLAS.MY", "Settings"]} />
      <main className="grid gap-4 p-4 pt-0">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Academic levels</CardTitle>
            <CardDescription>
              Manage the class levels and student years available across your
              centre. These appear in class and student forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcademicLevelsList
              levels={levels.map((level) => ({
                id: level.id,
                name: level.name,
                order: level.order,
                classCount: level._count.classes,
                studentCount: level._count.students,
              }))}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default AcademicLevelsPage;