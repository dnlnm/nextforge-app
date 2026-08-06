import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { ChevronDownIcon, PlusIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { getStudentFilterOptions, getStudentsForTable } from "./actions";
import { StudentsPageClient } from "./students-page-client";

const StudentsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const today = new Date();
  const startOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );

  const [allStudents, initialTableData, filterOptions] = await Promise.all([
    database.student.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      include: {
        invoices: {
          where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
        },
        guardians: {
          where: { isPrimary: true },
          include: { guardian: true },
          take: 1,
        },
        level: true,
      },
    }),
    getStudentsForTable({
      page: 0,
      pageSize: 10,
    }),
    getStudentFilterOptions(),
  ]);

  const activeStudents = allStudents.filter(
    (student) => student.status === "ACTIVE"
  );
  const newStudentsThisMonth = allStudents.filter(
    (student) => student.createdAt >= startOfMonth
  );
  const totalOutstandingSen = allStudents.reduce(
    (total, student) =>
      total +
      student.invoices.reduce(
        (invoiceTotal, invoice) =>
          invoiceTotal + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
        0
      ),
    0
  );
  const studentsWithOutstanding = allStudents.filter((student) =>
    student.invoices.some((invoice) => invoice.totalSen > invoice.amountPaidSen)
  );

  return (
    <>
      <Header page="Students" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Students</h1>
            <p className="text-muted-foreground text-sm">
              Manage student information and registration.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1 md:flex-none" variant="outline">
              <Link href="/students/template">
                <UploadIcon className="size-4" />
                <span className="hidden sm:inline">Import Students</span>
                <span className="sm:hidden">Import</span>
              </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none">
              <Link href="/students/new">
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
            <Button size="icon" variant="outline">
              <ChevronDownIcon className="size-4" />
            </Button>
          </div>
        </div>

        <StudentsPageClient
          activeStudents={activeStudents.length}
          allStudents={allStudents}
          classOptions={filterOptions.classes}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          levelOptions={filterOptions.levels}
          monthLabel={today.toLocaleString("en-MY", { month: "short" })}
          newStudentsThisMonth={newStudentsThisMonth.length}
          outstandingSen={totalOutstandingSen}
          statusOptions={filterOptions.statuses}
          studentsWithOutstanding={studentsWithOutstanding.length}
          totalStudents={allStudents.length}
          tutorOptions={filterOptions.tutors}
        />
      </main>
    </>
  );
};

export default StudentsPage;
