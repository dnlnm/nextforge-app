import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { getAcademicHierarchy } from "@repo/domain/academics/dashboard";
import { Header } from "../components/header";
import { AcademicPlanner } from "./academic-planner";

const AcademicsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [hierarchy, stats] = await Promise.all([
    getAcademicHierarchy(database, tenant.organizationId),
    database.$transaction([
      database.level.count({
        where: { archivedAt: null, organizationId: tenant.organizationId },
      }),
      database.subject.count({
        where: {
          archivedAt: null,
          organizationId: tenant.organizationId,
          status: "ACTIVE",
        },
      }),
      database.learningClass.count({
        where: {
          archivedAt: null,
          organizationId: tenant.organizationId,
          status: "ACTIVE",
        },
      }),
    ]),
  ]);

  return (
    <>
      <Header page="Academic Planner" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Academic Planner
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse the Level → Subject → Class hierarchy. Levels with no
            operational classes are still listed for context.
          </p>
        </div>

        <AcademicPlanner
          hierarchy={hierarchy}
          stats={{
            activeClasses: stats[2],
            activeSubjects: stats[1],
            activeLevels: stats[0],
          }}
        />
      </main>
    </>
  );
};

export default AcademicsPage;
