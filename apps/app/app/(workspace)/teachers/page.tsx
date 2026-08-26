import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { PlusIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import {
  KpiToggleButton,
  KpiVisibilityProvider,
} from "../components/kpi-visibility";
import { getTeachersForTable } from "./actions";
import { PendingInvitations } from "./pending-invitations";
import { TeachersPageClient } from "./teachers-page-client";

const TeachersPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [teachers, archivedTeachers, initialTableData] = await Promise.all([
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
      include: {
        branch: true,
        classes: {
          where: { archivedAt: null },
          include: {
            branch: true,
            enrollments: {
              where: { archivedAt: null, status: "ACTIVE" },
              select: { id: true },
            },
            subject: true,
          },
        },
      },
    }),
    database.teacherProfile.count({
      where: {
        organizationId: tenant.organizationId,
        archivedAt: { not: null },
      },
    }),
    getTeachersForTable({
      page: 0,
      pageSize: 10,
    }),
  ]);

  const assignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length > 0
  );
  const unassignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length === 0
  );
  const totalTeachers = teachers.length + archivedTeachers;

  return (
    <KpiVisibilityProvider>
      <Header page="Teachers" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Teachers</h1>
            <p className="text-muted-foreground text-sm">
              Manage teacher profiles, assignments, and contact details.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              className="min-w-0 flex-1 md:flex-none"
              render={<Link href="/teachers/invite" />}
              variant="outline"
            >
              <SendIcon className="size-4" />
              <span className="hidden sm:inline">Invite Teacher</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            <Button
              className="min-w-0 flex-1 md:flex-none"
              render={<Link href="/teachers/new" />}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Add Teacher</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <KpiToggleButton />
          </div>
        </div>

        <PendingInvitations />

        <TeachersPageClient
          activeTeachers={teachers.length}
          allTeachers={teachers}
          archivedTeachers={archivedTeachers}
          assignedTeachers={assignedTeachers.length}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          totalTeachers={totalTeachers}
          unassignedTeachers={unassignedTeachers.length}
        />
      </main>
    </KpiVisibilityProvider>
  );
};

export default TeachersPage;
