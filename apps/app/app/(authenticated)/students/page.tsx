import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
} from "@repo/design-system/components/ui/card";
import {
  ChevronDownIcon,
  PlusIcon,
  UploadIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { StudentsPageClient } from "./students-page-client";
import { getStudentsForTable, getStudentFilterOptions } from "./actions";

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const StudentsPage = async () => {
  const tenant = await requireTenant();
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

        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {[
            [
              "Total Students",
              allStudents.length.toLocaleString(),
              "+ 12 from last month",
            ],
            [
              "Active Students",
              activeStudents.length.toLocaleString(),
              `${allStudents.length > 0 ? Math.round((activeStudents.length / allStudents.length) * 100) : 0}% of total`,
            ],
            [
              `New Students (${today.toLocaleString("en-MY", { month: "short" })})`,
              newStudentsThisMonth.length.toLocaleString(),
              "+ 4 from last month",
            ],
            [
              "Outstanding Fees",
              formatMoney(totalOutstandingSen),
              `${studentsWithOutstanding.length} students`,
            ],
          ].map(([label, value, detail]) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
                  <UserRoundIcon className="size-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="mt-1 truncate font-semibold text-2xl tracking-tight">
                    {value}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <StudentsPageClient
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          classOptions={filterOptions.classes}
          tutorOptions={filterOptions.tutors}
          statusOptions={filterOptions.statuses}
          allStudents={allStudents}
        />
      </main>
    </>
  );
};

export default StudentsPage;
