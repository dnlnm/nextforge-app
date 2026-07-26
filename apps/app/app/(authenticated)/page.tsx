import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getBillingState } from "./billing/limits";
import { Header } from "./components/header";

export const metadata: Metadata = {
  title: "Dashboard - TLAS.MY",
  description: "Tuition centre administration dashboard.",
};

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const todayDate = () => new Date(new Date().toISOString().slice(0, 10));

const App = async () => {
  const tenant = await requireTenant();
  const today = todayDate();
  const [
    activeStudents,
    activeTeachers,
    activeClasses,
    todaySessions,
    openInvoices,
    recentPayments,
    settings,
    subjects,
    enrolments,
    billingState,
  ] = await Promise.all([
    database.student.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    database.teacherProfile.count({
      where: { organizationId: tenant.organizationId, archivedAt: null },
    }),
    database.learningClass.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    database.classSession.findMany({
      where: { organizationId: tenant.organizationId, sessionDate: today },
      include: {
        attendance: true,
        class: { include: { subject: true, teacher: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
    database.invoice.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
      include: { student: true },
      orderBy: [{ billingMonth: "desc" }, { invoiceNumber: "asc" }],
      take: 5,
    }),
    database.payment.findMany({
      where: { organizationId: tenant.organizationId },
      include: { student: true },
      orderBy: { paidAt: "desc" },
      take: 5,
    }),
    database.organizationSettings.findUnique({
      where: { organizationId: tenant.organizationId },
    }),
    database.subject.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    database.enrollment.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    getBillingState(tenant.organizationId),
  ]);
  const outstandingSen = openInvoices.reduce(
    (sum, invoice) => sum + (invoice.totalSen - invoice.amountPaidSen),
    0
  );
  const attendanceMarked = todaySessions.reduce(
    (sum, session) => sum + session.attendance.length,
    0
  );
  const checklist = [
    {
      done: Boolean(settings),
      href: "/settings",
      title: "Complete centre settings",
    },
    { done: activeTeachers > 0, href: "/teachers", title: "Add a teacher" },
    { done: subjects > 0, href: "/subjects", title: "Add a subject" },
    { done: activeClasses > 0, href: "/classes", title: "Create a class" },
    {
      done: activeStudents > 0,
      href: "/students",
      title: "Add or import students",
    },
    {
      done: enrolments > 0,
      href: "/classes",
      title: "Enrol students into classes",
    },
    {
      done: todaySessions.length > 0,
      href: "/today",
      title: "Create today's sessions",
    },
    {
      done: openInvoices.length > 0,
      href: "/invoices",
      title: "Generate first invoices",
    },
    {
      done: billingState.subscription.status === "ACTIVE",
      href: "/billing",
      title: "Choose a TLAS.MY plan",
    },
  ];
  const checklistComplete = checklist.filter((item) => item.done).length;

  return (
    <>
      <Header page="Dashboard" pages={["TLAS.MY"]} />
      <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {activeStudents}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {activeTeachers}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {activeClasses}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {todaySessions.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {formatMoney(outstandingSen)}
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Launch checklist</CardTitle>
              <CardDescription>
                {checklistComplete} of {checklist.length} setup steps complete
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {checklist.map((item) => (
                <Link
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  href={item.href}
                  key={item.title}
                >
                  <span className="flex items-center gap-2">
                    {item.done ? (
                      <CheckCircle2Icon className="h-4 w-4 text-success" />
                    ) : (
                      <CircleIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.title}
                  </span>
                  <span className="text-muted-foreground">
                    {item.done ? "Done" : "Open"}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s sessions</CardTitle>
              <CardDescription>
                {attendanceMarked} attendance records marked today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {session.startsAt}-{session.endsAt}
                      </TableCell>
                      <TableCell>{session.class.name}</TableCell>
                      <TableCell>
                        {session.class.teacher?.fullName ?? "-"}
                      </TableCell>
                      <TableCell>{session.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open invoices</CardTitle>
              <CardDescription>Newest unpaid invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link href={`/invoices/${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.student.fullName}</TableCell>
                      <TableCell>
                        {formatMoney(invoice.totalSen - invoice.amountPaidSen)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Latest manually recorded receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link href={`/payments/${payment.id}`}>
                        {payment.receiptNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{payment.student.fullName}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{formatMoney(payment.amountSen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default App;
