import { requireTenantRole } from "@repo/auth/authorization";
import { type DayOfWeek, database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { getClassTrends } from "@repo/domain/analytics";
import { getClassDashboard } from "@repo/domain/classes/dashboard";
import {
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ReceiptTextIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { endEnrollment, updateEnrollment } from "../actions";
import { ClassEditForm } from "../components/class-edit-form";
import { ClassAnalyticsTab } from "./class-analytics-tab";
import { ClassEnrollmentActions } from "./class-enrollment-actions";

interface ClassPageProperties {
  readonly params: Promise<{ classId: string }>;
}

const _DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const dayShortLabel: Record<DayOfWeek, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`1970-01-01T${value}:00`));

const ClassPage = async ({ params }: ClassPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { classId } = await params;
  const [
    learningClass,
    subjects,
    teachers,
    levels,
    rooms,
    dashboard,
    students,
    invoiceLines,
    trends,
  ] = await Promise.all([
    database.learningClass.findFirst({
      where: { id: classId, organizationId: tenant.organizationId },
      include: {
        enrollments: {
          where: { archivedAt: null, status: "ACTIVE" },
          include: { student: true },
          orderBy: { student: { fullName: "asc" } },
        },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
          include: { room: true },
        },
        subject: true,
        teacher: true,
        level: true,
      },
    }),
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ name: "asc" }],
    }),
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
    }),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
    }),
    database.room.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
    }),
    getClassDashboard(database, {
      classId,
      organizationId: tenant.organizationId,
    }),
    database.student.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
        enrollments: {
          none: {
            archivedAt: null,
            classId,
            organizationId: tenant.organizationId,
            status: "ACTIVE",
          },
        },
      },
      select: { code: true, fullName: true, id: true },
      orderBy: { fullName: "asc" },
    }),
    database.invoiceLineItem.findMany({
      where: { classId },
      include: {
        invoice: {
          select: {
            billingMonth: true,
            invoiceNumber: true,
            status: true,
            totalSen: true,
          },
        },
      },
      orderBy: { invoice: { billingMonth: "desc" } },
      take: 20,
    }),
    getClassTrends(database, tenant.organizationId, classId),
  ]);

  if (!learningClass) {
    notFound();
  }

  const enrolledStudentIds = new Set(
    learningClass.enrollments.map((enrollment) => enrollment.studentId)
  );
  const activeStudents = students.filter(
    (student) => !enrolledStudentIds.has(student.id)
  );
  const capacityLabel =
    dashboard?.capacity.capacity === null
      ? "Unlimited"
      : `${dashboard?.capacity.capacity ?? 0} seats`;

  return (
    <>
      <Header page={learningClass.name} pages={["Classes"]} />
      <main className="grid gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{learningClass.code}</Badge>
          <Badge variant="secondary">{learningClass.academicYear}</Badge>
          <Badge variant="secondary">
            {formatMoney(learningClass.monthlyFeeSen)}/mo
          </Badge>
          <Badge variant="secondary">{learningClass.subject.name}</Badge>
          {learningClass.teacher ? (
            <Button asChild size="sm" variant="link">
              <Link href={`/teachers/${learningClass.teacher.id}`}>
                {learningClass.teacher.fullName}
              </Link>
            </Button>
          ) : null}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="grid gap-1">
              <h1 className="font-semibold text-2xl tracking-tight">
                {learningClass.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {learningClass.level?.name ?? "No level"} · {capacityLabel} ·
                Starts {formatDate(learningClass.startsOn)}
              </p>
            </div>
            <ClassEnrollmentActions
              classId={learningClass.id}
              students={activeStudents}
            />
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat>
            <StatLabel>Enrollment</StatLabel>
            <StatIndicator color="info" variant="icon">
              <UsersRoundIcon />
            </StatIndicator>
            <StatValue>
              {dashboard?.activeEnrollmentCount ?? 0} /{" "}
              {dashboard?.capacity.capacity ?? "∞"}
            </StatValue>
            <StatDescription>
              {dashboard?.capacity.isFull
                ? "Class is full"
                : `${dashboard?.capacity.percentFull ?? 0}% utilized`}
            </StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Attendance</StatLabel>
            <StatIndicator color="success" variant="icon">
              <CalendarDaysIcon />
            </StatIndicator>
            <StatValue>
              {dashboard?.attendanceRate === null ||
              dashboard?.attendanceRate === undefined
                ? "No data"
                : `${dashboard.attendanceRate}%`}
            </StatValue>
            <StatDescription>This academic year</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Billed revenue</StatLabel>
            <StatIndicator color="warning" variant="icon">
              <CircleDollarSignIcon />
            </StatIndicator>
            <StatValue>
              {formatMoney(dashboard?.billedRevenueSen ?? 0)}
            </StatValue>
            <StatDescription>Billed, not collected</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Outstanding fees</StatLabel>
            <StatIndicator color="default" variant="icon">
              <ReceiptTextIcon />
            </StatIndicator>
            <StatValue>{formatMoney(dashboard?.outstandingSen ?? 0)}</StatValue>
            <StatDescription>Unpaid invoice balance</StatDescription>
          </Stat>
        </section>

        <Tabs className="gap-4" defaultValue="students">
          <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Roster</CardTitle>
                <CardDescription>
                  {learningClass.enrollments.length} active students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {learningClass.enrollments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No students enrolled yet. Use Add Student or Bulk Add above.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Custom fee</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learningClass.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <Button asChild size="sm" variant="link">
                              <Link href={`/students/${enrollment.student.id}`}>
                                {enrollment.student.fullName}
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <form
                              action={updateEnrollment}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <input
                                name="enrollmentId"
                                type="hidden"
                                value={enrollment.id}
                              />
                              <input
                                className="h-8 w-24 rounded-md border px-2 text-sm"
                                defaultValue={
                                  enrollment.customFeeSen === null
                                    ? ""
                                    : (enrollment.customFeeSen / 100).toFixed(2)
                                }
                                min="0"
                                name="customFee"
                                placeholder="Default"
                                step="0.01"
                                type="number"
                              />
                              <Button size="sm" type="submit" variant="outline">
                                Save
                              </Button>
                            </form>
                          </TableCell>
                          <TableCell className="text-right">
                            <form action={endEnrollment}>
                              <input
                                name="enrollmentId"
                                type="hidden"
                                value={enrollment.id}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                End
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Recurring class schedule by weekday.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {learningClass.schedules.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No schedule configured for this class.
                  </p>
                ) : (
                  learningClass.schedules.map((schedule) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                      key={schedule.id}
                    >
                      <span className="font-medium">
                        {dayShortLabel[schedule.dayOfWeek]}
                      </span>
                      <span className="text-muted-foreground">
                        {formatTime(schedule.startsAt)} -{" "}
                        {formatTime(schedule.endsAt)}
                        {schedule.room ? ` · ${schedule.room.name}` : ""}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {trends ? <ClassAnalyticsTab trends={trends} /> : null}
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billed lines</CardTitle>
                <CardDescription>
                  Recent invoice line items attributed to this class.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoiceLines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No invoice lines attributed to this class yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{line.invoice.billingMonth}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {line.invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(line.totalSen)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Edit class</CardTitle>
                <CardDescription>
                  Update schedule, teacher, rooms, and fee.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassEditForm
                  classId={learningClass.id}
                  initialSchedules={learningClass.schedules}
                  initialValues={{
                    academicYear: learningClass.academicYear,
                    capacity: learningClass.capacity,
                    code: learningClass.code,
                    endsOn: learningClass.endsOn,
                    levelId: learningClass.levelId,
                    monthlyFeeSen: learningClass.monthlyFeeSen,
                    name: learningClass.name,
                    startsOn: learningClass.startsOn,
                    subjectId: learningClass.subjectId,
                    teacherId: learningClass.teacherId,
                  }}
                  levels={levels}
                  rooms={rooms}
                  subjects={subjects}
                  teachers={teachers}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default ClassPage;
