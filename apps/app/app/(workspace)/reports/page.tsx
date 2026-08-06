import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
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
import Link from "next/link";
import { Header } from "../components/header";

const exports = [
  ["students", "Students"],
  ["enrolments", "Class enrolments"],
  ["invoices", "Invoices"],
  ["payments", "Payments"],
  ["attendance", "Attendance"],
] as const;

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const ReportsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const [students, classes, attendance, invoices, payments] = await Promise.all(
    [
      database.student.findMany({
        where: { organizationId: tenant.organizationId, status: "ACTIVE" },
        orderBy: { fullName: "asc" },
        take: 50,
        include: { level: true },
      }),
      database.learningClass.findMany({
        where: { organizationId: tenant.organizationId, status: "ACTIVE" },
        include: {
          enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
          subject: true,
          teacher: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
        take: 50,
      }),
      database.attendanceRecord.groupBy({
        by: ["status"],
        where: { organizationId: tenant.organizationId },
        _count: { id: true },
      }),
      database.invoice.findMany({
        where: { organizationId: tenant.organizationId },
        orderBy: [{ billingMonth: "desc" }, { invoiceNumber: "desc" }],
        include: { student: true },
        take: 50,
      }),
      database.payment.groupBy({
        by: ["method"],
        where: { organizationId: tenant.organizationId, status: "RECORDED" },
        _sum: { amountSen: true },
        _count: { id: true },
      }),
    ]
  );
  const invoicedSen = invoices.reduce(
    (sum, invoice) => sum + invoice.totalSen,
    0
  );
  const paidSen = invoices.reduce(
    (sum, invoice) => sum + invoice.amountPaidSen,
    0
  );

  return (
    <>
      <Header page="Reports" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>CSV exports</CardTitle>
            <CardDescription>
              Download tenant-scoped operational and finance data for
              spreadsheet review.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {exports.map(([kind, label]) => (
              <Button asChild key={kind} variant="outline">
                <Link href={`/reports/exports/${kind}`}>{label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Invoiced</CardTitle>
              <CardDescription>Latest 50 invoices</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {formatMoney(invoicedSen)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Collected</CardTitle>
              <CardDescription>Allocated invoice payments</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {formatMoney(paidSen)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outstanding</CardTitle>
              <CardDescription>From latest 50 invoices</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-3xl">
              {formatMoney(invoicedSen - paidSen)}
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Class enrolment</CardTitle>
              <CardDescription>
                Active classes and student counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.subject.name}</TableCell>
                      <TableCell>{item.teacher?.fullName ?? "-"}</TableCell>
                      <TableCell>{item.enrollments.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attendance status</CardTitle>
              <CardDescription>All marked attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item._count.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active students</CardTitle>
              <CardDescription>First 50 students by name</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.fullName}
                      </TableCell>
                      <TableCell>{student.schoolName ?? "-"}</TableCell>
                      <TableCell>{student.level?.name ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payments by method</CardTitle>
              <CardDescription>
                Recorded payments grouped by method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.method}>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment._count.id}</TableCell>
                      <TableCell>
                        {formatMoney(payment._sum.amountSen ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default ReportsPage;
