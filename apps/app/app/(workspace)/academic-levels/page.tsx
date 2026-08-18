import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database, type LevelStage } from "@repo/database";
import { Header } from "../components/header";
import { AcademicLevelsList } from "./academic-levels-list";

const STAGE_GROUPS: { readonly id: string; readonly stages: LevelStage[] }[] = [
  { id: "PRIMARY", stages: ["PRIMARY"] },
  { id: "SECONDARY", stages: ["LOWER_SECONDARY", "UPPER_SECONDARY"] },
  { id: "PRE_UNIVERSITY", stages: ["PRE_UNIVERSITY"] },
  { id: "GENERAL", stages: ["GENERAL"] },
];

const groupLevels = (
  levels: readonly {
    readonly code: string;
    readonly id: string;
    readonly name: string;
    readonly order: number;
    readonly stage: LevelStage;
    readonly _count: { readonly classes: number; readonly students: number };
  }[]
) =>
  STAGE_GROUPS.map((group) => ({
    id: group.id,
    levels: levels
      .filter((level) => group.stages.includes(level.stage))
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

const AcademicLevelsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [active, archived] = await Promise.all([
    database.level.findMany({
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
    }),
    database.level.findMany({
      where: {
        organizationId: tenant.organizationId,
        archivedAt: { not: null },
      },
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
    }),
  ]);

  return (
    <>
      <Header page="Academic Levels" pages={[`${appName}`]} />
      <main className="p-4 pt-4 sm:p-6 sm:pt-4">
        <AcademicLevelsList
          archivedGroups={groupLevels(archived)}
          groups={groupLevels(active)}
        />
      </main>
    </>
  );
};

export default AcademicLevelsPage;
