import { requireTenantRole } from "@repo/auth/authorization";
import { type AttendanceStatus, database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  Edit3Icon,
  ExternalLinkIcon,
  LandmarkIcon,
  MailIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  SchoolIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";

interface StudentPageProperties {
  readonly params: Promise<{ studentId: string }>;
}

const attendanceLabels: Record<AttendanceStatus, string> = {
  ABSENT: "Absent",
  EXCUSED: "Excused",
  LATE: "Late",
  PRESENT: "Present",
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`1970-01-01T${value}:00`));

const studentCode = (studentIndex: number) =>
  `STU${String(studentIndex + 145).padStart(5, "0")}`;

const getStudentData = async (studentId: string, organizationId: string) => {
  const [student, studentCount] = await Promise.all([
    database.student.findFirst({
      where: { id: studentId, organizationId },
      include: {
        branch: true,
        guardians: {
          include: { guardian: true },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        enrollments: {
          where: { archivedAt: null, status: "ACTIVE" },
          include: {
            class: {
              include: { branch: true, subject: true, teacher: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          orderBy: { billingMonth: "desc" },
          take: 6,
        },
        attendanceRecords: {
          orderBy: { markedAt: "desc" },
          take: 8,
          include: {
            session: {
              include: { class: { include: { subject: true, teacher: true } } },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 6,
        },
      },
    }),
    database.student.count({
      where: { organizationId, archivedAt: null },
    }),
  ]);

  return { student, studentCount };
};

type StudentData = NonNullable<
  Awaited<ReturnType<typeof getStudentData>>["student"]
>;

const StudentHeader = ({
  primaryGuardianPhone,
  student,
  studentIndex,
}: {
  readonly primaryGuardianPhone?: string;
  readonly student: StudentData;
  readonly studentIndex: number;
}) => (
  <Card>
    <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
          <UserRoundIcon className="size-10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-semibold text-2xl tracking-tight md:text-3xl">
              {student.fullName}
            </h1>
            <Badge variant="outline">
              {student.status === "ACTIVE" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{studentCode(studentIndex)}</span>
            <span>•</span>
            <span>{student.branch?.name ?? "No branch assigned"}</span>
            <span>•</span>
            <span>{student.academicLevel ?? "No academic level"}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">
              Enrolled {formatDate(student.enrolledAt)}
            </Badge>
            {student.preferredName ? (
              <Badge variant="secondary">
                Preferred name: {student.preferredName}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:w-auto md:min-w-[18rem]">
        <Button asChild variant="outline">
          <Link href={`/students/${student.id}/edit`}>
            <Edit3Icon className="size-4" />
            Edit profile
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`https://wa.me/${primaryGuardianPhone ?? ""}`}>
            <PhoneIcon className="size-4" />
            WhatsApp guardian
          </Link>
        </Button>
        <Button variant="outline">
          <CreditCardIcon className="size-4" />
          Create invoice
        </Button>
        <Button variant="outline">
          <MoreHorizontalIcon className="size-4" />
          More
        </Button>
      </div>
    </CardContent>
  </Card>
);

const StudentMetrics = ({
  attendanceRate,
  activeEnrollments,
  outstandingSen,
  student,
  totalBilledSen,
  totalPaidSen,
}: {
  readonly activeEnrollments: number;
  readonly attendanceRate: number;
  readonly outstandingSen: number;
  readonly student: StudentData;
  readonly totalBilledSen: number;
  readonly totalPaidSen: number;
}) => (
  <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
    {[
      ["Active Classes", activeEnrollments.toString(), "Currently enrolled"],
      [
        "Outstanding",
        formatMoney(outstandingSen),
        `${student.invoices.length} invoices`,
      ],
      ["Paid", formatMoney(totalPaidSen), formatMoney(totalBilledSen)],
      [
        "Attendance",
        `${attendanceRate}%`,
        `${student.attendanceRecords.length} records`,
      ],
    ].map(([label, value, detail]) => (
      <Card key={label}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-14 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
            <LandmarkIcon className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 truncate font-semibold text-2xl tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </section>
);

const StudentOverviewTab = ({ student }: { readonly student: StudentData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Student Profile</CardTitle>
      <CardDescription>
        Core student information and administrative details.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      {[
        ["Full name", student.fullName],
        ["Preferred name", student.preferredName ?? "-"],
        ["School", student.schoolName ?? "-"],
        ["Academic level", student.academicLevel ?? "-"],
        ["Branch", student.branch?.name ?? "-"],
        ["Enrolled", formatDate(student.enrolledAt)],
      ].map(([label, value]) => (
        <div className="grid gap-1" key={label}>
          <span className="text-muted-foreground text-xs">{label}</span>
          <span className="font-medium text-sm">{value}</span>
        </div>
      ))}
      <div className="md:col-span-2">
        <Separator className="my-1" />
        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs">Notes</span>
          <p className="text-sm">
            {student.notes ?? "No student notes recorded."}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StudentAcademicsTab = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Active Classes</CardTitle>
      <CardDescription>
        Current enrollments and class assignments.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
      {student.enrollments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No active class enrollments yet.
        </p>
      ) : (
        student.enrollments.map((enrollment) => (
          <div
            className="flex flex-col gap-3 border p-4 md:flex-row md:items-center md:justify-between"
            key={enrollment.id}
          >
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{enrollment.class.name}</span>
                <Badge variant="secondary">
                  {enrollment.class.subject.name}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {enrollment.class.dayOfWeek} ·{" "}
                {formatTime(enrollment.class.startsAt)} to{" "}
                {formatTime(enrollment.class.endsAt)} ·{" "}
                {enrollment.class.teacher?.fullName ?? "No teacher"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">
                {enrollment.class.branch?.name ?? "Main branch"}
              </Badge>
              <Badge variant="outline">
                {enrollment.customFeeSen
                  ? formatMoney(enrollment.customFeeSen)
                  : formatMoney(enrollment.class.monthlyFeeSen)}
              </Badge>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

const StudentGuardiansTab = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Guardians</CardTitle>
      <CardDescription>
        Primary and secondary guardian contacts.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
      {student.guardians.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No guardians linked to this student.
        </p>
      ) : (
        student.guardians.map((link) => {
          const guardian = link.guardian;
          const address = [
            guardian.addressLine1,
            guardian.addressLine2,
            guardian.city,
            guardian.state,
            guardian.postcode,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div className="border p-4" key={link.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{guardian.fullName}</p>
                    {link.isPrimary ? <Badge>Primary</Badge> : null}
                    {link.receivesBilling ? (
                      <Badge variant="secondary">Billing contact</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {link.relationship}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="size-4 text-muted-foreground" />
                  <span>{guardian.phone ?? "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{guardian.email ?? "-"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm md:col-span-2">
                  <MapPinIcon className="mt-0.5 size-4 text-muted-foreground" />
                  <span>{address || "-"}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </CardContent>
  </Card>
);

const StudentBillingTab = ({ student }: { readonly student: StudentData }) => {
  const totalBilledSen = student.invoices.reduce(
    (total, invoice) => total + invoice.totalSen,
    0
  );
  const totalPaidSen = student.invoices.reduce(
    (total, invoice) => total + invoice.amountPaidSen,
    0
  );
  const outstandingSen = student.invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Summary</CardTitle>
        <CardDescription>
          Outstanding balance and recent invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Total billed", formatMoney(totalBilledSen)],
            ["Total paid", formatMoney(totalPaidSen)],
            ["Outstanding", formatMoney(outstandingSen)],
          ].map(([label, value]) => (
            <div className="border p-4" key={label}>
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="mt-1 font-semibold text-xl">{value}</p>
            </div>
          ))}
        </div>
        {student.invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No invoices have been issued for this student.
          </p>
        ) : (
          <div className="grid gap-3">
            {student.invoices.map((invoice) => {
              const balanceSen = Math.max(
                0,
                invoice.totalSen - invoice.amountPaidSen
              );

              return (
                <div
                  className="flex flex-col gap-2 border p-4 md:flex-row md:items-center md:justify-between"
                  key={invoice.id}
                >
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {invoice.invoiceNumber}
                      </span>
                      <Badge variant="outline">{invoice.status}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {invoice.billingMonth} · Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p>{formatMoney(invoice.totalSen)}</p>
                    <p className="text-muted-foreground">
                      Balance {formatMoney(balanceSen)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Separator />
        <div className="grid gap-3">
          <h3 className="font-medium text-sm">Recent Payments</h3>
          {student.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No payments recorded yet.
            </p>
          ) : (
            student.payments.map((payment) => (
              <div
                className="flex flex-col gap-1 border p-4 md:flex-row md:items-center md:justify-between"
                key={payment.id}
              >
                <div className="grid gap-1">
                  <p className="font-medium text-sm">{payment.receiptNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(payment.createdAt)} · {payment.method}
                  </p>
                </div>
                <div className="text-sm">
                  <p>{formatMoney(payment.amountSen)}</p>
                  <p className="text-muted-foreground">{payment.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StudentAttendanceTab = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Attendance History</CardTitle>
      <CardDescription>
        Recent session attendance and status tracking.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3">
      {student.attendanceRecords.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No attendance records found.
        </p>
      ) : (
        student.attendanceRecords.map((record) => (
          <div
            className="flex flex-col gap-2 border p-4 md:flex-row md:items-center md:justify-between"
            key={record.id}
          >
            <div className="grid gap-1">
              <p className="font-medium">
                {record.session.class.subject.name} ·{" "}
                {record.session.class.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatDate(record.session.sessionDate)} ·{" "}
                {record.session.startsAt} to {record.session.endsAt} ·{" "}
                {record.session.class.teacher?.fullName ?? "No teacher"}
              </p>
            </div>
            <Badge variant="outline">{attendanceLabels[record.status]}</Badge>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

const StudentNotesTab = ({ student }: { readonly student: StudentData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Notes</CardTitle>
      <CardDescription>Internal notes and follow-up reminders.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm">
        {student.notes ?? "No notes recorded for this student."}
      </p>
    </CardContent>
  </Card>
);

const StudentSidebar = ({
  primaryGuardian,
  student,
  totalBilledSen,
  totalPaidSen,
  outstandingSen,
}: {
  readonly primaryGuardian?: StudentData["guardians"][number]["guardian"];
  readonly outstandingSen: number;
  readonly student: StudentData;
  readonly totalBilledSen: number;
  readonly totalPaidSen: number;
}) => (
  <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Summary</CardTitle>
        <CardDescription>
          High-level contact and status information.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 border-b pb-4 text-sm">
          <div className="flex items-center gap-2">
            <SchoolIcon className="size-4 text-muted-foreground" />
            <span>{student.schoolName ?? "No school linked"}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpenIcon className="size-4 text-muted-foreground" />
            <span>{student.academicLevel ?? "No academic level"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 text-muted-foreground" />
            <span>Joined {formatDate(student.enrolledAt)}</span>
          </div>
        </div>

        <div className="grid gap-3 border-b pb-4">
          <div className="flex items-center gap-2 font-medium text-sm">
            <UsersRoundIcon className="size-4 text-muted-foreground" />
            Primary Guardian
          </div>
          <div className="grid gap-1 text-sm">
            <p>{primaryGuardian?.fullName ?? "No guardian linked"}</p>
            <p className="text-muted-foreground">
              {primaryGuardian?.phone ?? "No phone"}
            </p>
            <p className="text-muted-foreground">
              {primaryGuardian?.email ?? "No email"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 border-b pb-4">
          <div className="flex items-center gap-2 font-medium text-sm">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            Finance
          </div>
          <div className="grid gap-1 text-sm">
            <p>Total billed: {formatMoney(totalBilledSen)}</p>
            <p>Total paid: {formatMoney(totalPaidSen)}</p>
            <p>Outstanding: {formatMoney(outstandingSen)}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center gap-2 font-medium text-sm">
            <ExternalLinkIcon className="size-4 text-muted-foreground" />
            Actions
          </div>
          <Button asChild variant="outline">
            <Link href={`/students/${student.id}/edit`}>Edit profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`https://wa.me/${primaryGuardian?.phone ?? ""}`}>
              Message guardian
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </aside>
);

const StudentProfilePage = async ({ params }: StudentPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { studentId } = await params;
  const { student, studentCount } = await getStudentData(
    studentId,
    tenant.organizationId
  );

  if (!student) {
    notFound();
  }

  const primaryGuardian = student.guardians.at(0)?.guardian;
  const totalBilledSen = student.invoices.reduce(
    (total, invoice) => total + invoice.totalSen,
    0
  );
  const totalPaidSen = student.invoices.reduce(
    (total, invoice) => total + invoice.amountPaidSen,
    0
  );
  const outstandingSen = student.invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
    0
  );
  const activeEnrollments = student.enrollments.length;
  const presentCount = student.attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;
  const attendanceRate =
    student.attendanceRecords.length > 0
      ? Math.round((presentCount / student.attendanceRecords.length) * 100)
      : 0;
  const studentIndex = Math.max(studentCount - 1, 0);

  return (
    <>
      <Header
        page="Student Information"
        pages={["TLAS.MY", { href: "/students", label: "Students" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Student Information
            </h1>
            <p className="text-muted-foreground text-sm">
              View student profile details, guardian contacts, class enrollments,
              billing, and attendance.
            </p>
          </div>
        </div>

        <section className="grid gap-5 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_380px]">
          <section className="grid content-start gap-5">
            <StudentHeader
              primaryGuardianPhone={primaryGuardian?.phone ?? undefined}
              student={student}
              studentIndex={studentIndex}
            />

            <StudentMetrics
              activeEnrollments={activeEnrollments}
              attendanceRate={attendanceRate}
              outstandingSen={outstandingSen}
              student={student}
              totalBilledSen={totalBilledSen}
              totalPaidSen={totalPaidSen}
            />

            <Tabs className="gap-4" defaultValue="overview">
              <TabsList className="grid h-auto w-full grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="guardians">Guardians</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent className="grid gap-5" value="overview">
                <StudentOverviewTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="academics">
                <StudentAcademicsTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="guardians">
                <StudentGuardiansTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="billing">
                <StudentBillingTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="attendance">
                <StudentAttendanceTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="notes">
                <StudentNotesTab student={student} />
              </TabsContent>
            </Tabs>
          </section>

          <StudentSidebar
            outstandingSen={outstandingSen}
            primaryGuardian={primaryGuardian}
            student={student}
            totalBilledSen={totalBilledSen}
            totalPaidSen={totalPaidSen}
          />
        </section>
      </main>
    </>
  );
};

export default StudentProfilePage;
