import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import type { InvoiceStatus } from "@repo/database";
import { database } from "@repo/database";
import { formatMonthShort, getMalaysiaToday } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import { PlusIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../components/header";
import {
  getStudentDetail,
  getStudentFilterOptions,
  getStudentsForTable,
} from "./actions";
import { KpiToggleButton, KpiVisibilityProvider } from "./kpi-visibility";
import { StudentsPageClient } from "./students-page-client";

const openInvoiceStatuses: InvoiceStatus[] = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
];

const StudentsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  // "Today" is the Asia/Kuala_Lumpur calendar day; derive the month start from
  // it using its UTC-midnight representation (a UTC-midnight calendar date).
  const today = getMalaysiaToday();
  const startOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );

  const [
    currency,
    totalStudents,
    activeStudents,
    newStudentsThisMonth,
    outstanding,
    initialTableData,
    filterOptions,
  ] = await Promise.all([
    getOrganizationCurrency(tenant.organizationId),
    database.student.count({
      where: { organizationId: tenant.organizationId, archivedAt: null },
    }),
    database.student.count({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
    }),
    database.student.count({
      where: {
        archivedAt: null,
        createdAt: { gte: startOfMonth },
        organizationId: tenant.organizationId,
      },
    }),
    // Aggregate the outstanding balance in SQL instead of loading every student
    // with nested invoices just to sum it.
    database.invoice.aggregate({
      _sum: { amountPaidSen: true, totalSen: true },
      where: {
        organizationId: tenant.organizationId,
        status: { in: openInvoiceStatuses },
      },
    }),
    getStudentsForTable({
      page: 0,
      pageSize: 10,
    }),
    getStudentFilterOptions(),
  ]);

  // Fields set by InvoiceStatus.PAID/voided rows never factor into outstanding
  // (they're excluded above); open invoices are never overpaid, so the balance
  // is a plain difference.
  const outstandingSum = outstanding._sum ?? {
    amountPaidSen: 0,
    totalSen: 0,
  };
  const totalOutstandingSen = Math.max(
    0,
    (outstandingSum.totalSen ?? 0) - (outstandingSum.amountPaidSen ?? 0)
  );

  // Count how many distinct students owe something (have an open invoice).
  const studentsWithInvoiceBalance = await database.invoice.groupBy({
    by: ["studentId"],
    where: {
      organizationId: tenant.organizationId,
      status: { in: openInvoiceStatuses },
    },
  });

  // Detail of the first table row, used to seed the aside panel. The full list
  // of students + invoices is no longer shipped to the client.
  const firstStudent = initialTableData.data[0];
  const defaultStudentDetail = firstStudent
    ? await getStudentDetail(firstStudent.id)
    : null;

  return (
    <KpiVisibilityProvider>
      <Header page="Students" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Students</h1>
            <p className="text-muted-foreground text-sm">
              Manage student information and registration.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              className="min-w-0 flex-1 md:flex-none"
              render={<Link href="/students/import" />}
              variant="outline"
            >
              <UploadIcon className="size-4" />
              <span className="hidden sm:inline">Import Students</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              className="min-w-0 flex-1 md:flex-none"
              render={<Link href="/students/new" />}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <KpiToggleButton />
          </div>
        </div>

        <StudentsPageClient
          activeStudents={activeStudents}
          classOptions={filterOptions.classes}
          currency={currency}
          defaultStudentDetail={defaultStudentDetail}
          genderOptions={filterOptions.genders}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          levelOptions={filterOptions.levels}
          monthLabel={formatMonthShort(today)}
          newStudentsThisMonth={newStudentsThisMonth}
          outstandingSen={totalOutstandingSen}
          studentsWithOutstanding={studentsWithInvoiceBalance.length}
          totalStudents={totalStudents}
          tutorOptions={filterOptions.tutors}
        />
      </main>
    </KpiVisibilityProvider>
  );
};

export default StudentsPage;
