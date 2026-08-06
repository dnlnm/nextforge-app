import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { ChevronDownIcon, PlusIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { getTeacherFilterOptions, getTeachersForTable } from "./actions";
import { PendingInvitations } from "./pending-invitations";
import { TeachersPageClient } from "./teachers-page-client";

const TeachersPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [teachers, archivedTeachers, initialTableData, filterOptions] =
    await Promise.all([
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
      getTeacherFilterOptions(),
    ]);

  const assignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length > 0
  );
  const unassignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length === 0
  );
  const totalTeachers = teachers.length + archivedTeachers;

  return (
    <>
      <Header page="Teachers" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Teachers</h1>
            <p className="text-muted-foreground text-sm">
              Manage teacher profiles, assignments, and contact details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1 md:flex-none" variant="outline">
              <Link href="/teachers/invite">
                <SendIcon className="size-4" />
                <span className="hidden sm:inline">Invite Teacher</span>
                <span className="sm:hidden">Invite</span>
              </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none">
              <Link href="/teachers/new">
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Add Teacher</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
            <Button size="icon" variant="outline">
              <ChevronDownIcon className="size-4" />
            </Button>
          </div>
        </div>

        <PendingInvitations />

        <TeachersPageClient
          activeTeachers={teachers.length}
          allTeachers={teachers}
          archivedTeachers={archivedTeachers}
          assignedTeachers={assignedTeachers.length}
          branchOptions={filterOptions.branches}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          subjectOptions={filterOptions.subjects}
          totalTeachers={totalTeachers}
          unassignedTeachers={unassignedTeachers.length}
        />
      </main>
    </>
  );
};

export default TeachersPage;
