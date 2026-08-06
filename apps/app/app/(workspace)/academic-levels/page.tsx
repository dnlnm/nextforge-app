import { requireTenantRole } from "@repo/auth/authorization";
import { database, type LevelStage } from "@repo/database";
import { Header } from "../components/header";
import { AcademicLevelsList } from "./academic-levels-list";
import { AddLevelDialog } from "./add-level-dialog";

const STAGE_ORDER: LevelStage[] = [
  "PRIMARY",
  "LOWER_SECONDARY",
  "UPPER_SECONDARY",
  "PRE_UNIVERSITY",
  "GENERAL",
];

const AcademicLevelsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const levels = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { order: "asc" },
    select: {
      code: true,
      id: true,
      name: true,
      order: true,
      stage: true,
      _count: {
        select: {
          classes: { where: { archivedAt: null } },
          students: { where: { archivedAt: null } },
        },
      },
    },
  });

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    levels: levels
      .filter((level) => level.stage === stage)
      .map((level) => ({
        classCount: level._count.classes,
        code: level.code,
        id: level.id,
        name: level.name,
        order: level.order,
        stage: level.stage,
        studentCount: level._count.students,
      })),
  }));

  const archived = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    select: {
      code: true,
      id: true,
      name: true,
      order: true,
      stage: true,
      _count: {
        select: {
          classes: { where: { archivedAt: null } },
          students: { where: { archivedAt: null } },
        },
      },
    },
  });

  const archivedLevels = archived.map((level) => ({
    classCount: level._count.classes,
    code: level.code,
    id: level.id,
    name: level.name,
    order: level.order,
    stage: level.stage,
    studentCount: level._count.students,
  }));

  return (
    <>
      <Header page="Academic Levels" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Academic Levels
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage academic stages and levels for your centre.
            </p>
          </div>
          <AddLevelDialog />
        </div>

        <AcademicLevelsList archived={archivedLevels} grouped={grouped} />
      </main>
    </>
  );
};

export default AcademicLevelsPage;
