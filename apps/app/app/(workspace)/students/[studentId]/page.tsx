import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { type AttendanceStatus, database } from "@repo/database";
import {
  formatCalendarDate,
  formatShortDate,
  formatWallClockTime,
} from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { getStudentTrends } from "@repo/domain/analytics";
import {
  getStudentDashboard,
  getStudentOverview,
  listStudentActivity,
} from "@repo/domain/students/dashboard";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import { privateFileUrl } from "@repo/storage/client";
import { LandmarkIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../../components/header";
import { StudentAvatar } from "../../components/student-avatar";
import { StudentProfileActions } from "../../components/student-profile-actions";
import { FEE_DUE_DAYS, ordinalSuffix, REFERRAL_SOURCES } from "../lib/options";
import { EditableField } from "./editable-field";
import { StudentActivityTimeline } from "./student-activity-timeline";
import { StudentAnalyticsTab } from "./student-analytics-tab";
import { StudentQuickActions } from "./student-quick-actions";

interface StudentPageProperties {
  readonly params: Promise<{ studentId: string }>;
}

const attendanceLabels: Record<AttendanceStatus, string> = {
  ABSENT: "Absent",
  EXCUSED: "Excused",
  LATE: "Late",
  PRESENT: "Present",
};

const formatDate = (date: Date) => formatShortDate(date);

const formatTime = (value: string) => formatWallClockTime(value);

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const getStudentData = async (studentId: string, organizationId: string) => {
  const student = await database.student.findFirst({
    where: { id: studentId, organizationId },
    include: {
      branch: true,
      level: true,
      guardians: {
        include: { guardian: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      enrollments: {
        where: { archivedAt: null, status: "ACTIVE" },
        include: {
          class: {
            include: {
              branch: true,
              schedules: {
                orderBy: { dayOfWeek: "asc" },
                include: { room: { select: { name: true } } },
              },
              subject: true,
              teacher: true,
            },
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
  });

  return student;
};

type StudentData = NonNullable<Awaited<ReturnType<typeof getStudentData>>>;

const getEnrollableClasses = async (organizationId: string) => {
  const classes = await database.learningClass.findMany({
    where: {
      archivedAt: null,
      organizationId,
      status: "ACTIVE",
    },
    include: {
      level: { select: { name: true } },
      schedules: {
        orderBy: { dayOfWeek: "asc" },
        select: { dayOfWeek: true, endsAt: true, startsAt: true },
      },
      subject: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
    orderBy: { name: "asc" },
  });

  return classes.map((learningClass) => ({
    capacity: learningClass.capacity,
    id: learningClass.id,
    levelName: learningClass.level?.name ?? null,
    monthlyFeeSen: learningClass.monthlyFeeSen,
    name: learningClass.name,
    scheduleLabel:
      learningClass.schedules.length > 0
        ? learningClass.schedules
            .map(
              (schedule) =>
                `${schedule.dayOfWeek} ${schedule.startsAt}-${schedule.endsAt}`
            )
            .join(", ")
        : "No schedule",
    subjectName: learningClass.subject.name,
    teacherName: learningClass.teacher?.fullName ?? null,
  }));
};

const StudentHeader = ({
  primaryGuardianPhone,
  student,
}: {
  readonly primaryGuardianPhone?: string;
  readonly student: StudentData;
}) => (
  <CardShell>
    <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <StudentAvatar
          className="size-20 shrink-0"
          gender={student.gender}
          name={student.fullName}
          photoUrl={privateFileUrl(student.photoKey)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
              <span className="text-balance">{student.fullName}</span>
            </h1>
            <Badge variant="outline">
              {student.status === "ACTIVE" ? "Active" : "Archived"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{student.code}</span>
            <span>•</span>
            <span>{student.branch?.name ?? "No branch assigned"}</span>
            <span>•</span>
            <span>{student.level?.name ?? "No academic level"}</span>
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
        <Button
          render={<Link href={`https://wa.me/${primaryGuardianPhone ?? ""}`} />}
          variant="outline"
        >
          <PhoneIcon className="size-4" />
          WhatsApp guardian
        </Button>
        <StudentProfileActions status={student.status} studentId={student.id} />
      </div>
    </CardContent>
  </CardShell>
);

const StudentMetrics = ({
  attendanceRate,
  activeEnrollments,
  formatMoney,
  outstandingSen,
  totalBilledSen,
  totalPaidSen,
}: {
  readonly activeEnrollments: number;
  readonly attendanceRate: number;
  readonly formatMoney: (amountSen: number) => string;
  readonly outstandingSen: number;
  readonly totalBilledSen: number;
  readonly totalPaidSen: number;
}) => (
  <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
    {[
      ["Active Classes", activeEnrollments.toString(), "Currently enrolled"],
      ["Outstanding", formatMoney(outstandingSen), "Outstanding balance"],
      ["Paid", formatMoney(totalPaidSen), formatMoney(totalBilledSen)],
      ["Attendance", `${attendanceRate}%`, "This academic year"],
    ].map(([label, value, detail]) => (
      <CardShell key={label}>
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
      </CardShell>
    ))}
  </section>
);

const ProfileField = ({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) => (
  <div className="grid min-w-0 gap-1">
    <span className="text-muted-foreground text-xs">{label}</span>
    {children}
  </div>
);

interface LevelOption {
  readonly id: string;
  readonly name: string;
  readonly stage: string;
}

const GENDER_SELECT_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const RELATIONSHIP_SELECT_OPTIONS = [
  { label: "Father", value: "FATHER" },
  { label: "Mother", value: "MOTHER" },
  { label: "Guardian", value: "GUARDIAN" },
  { label: "Other", value: "OTHER" },
];

const PersonalProfileFields = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <>
    <ProfileField label="Full name">
      <EditableField
        field="fullName"
        label="full name"
        placeholder="Add full name"
        studentId={student.id}
        type="text"
        value={student.fullName}
      />
    </ProfileField>
    <ProfileField label="Preferred name">
      <EditableField
        field="preferredName"
        label="preferred name"
        placeholder="Add preferred name"
        studentId={student.id}
        type="text"
        value={student.preferredName}
      />
    </ProfileField>
    <ProfileField label="Date of birth">
      <EditableField
        display={
          student.dateOfBirth ? formatDate(student.dateOfBirth) : null
        }
        field="dateOfBirth"
        label="date of birth"
        placeholder="Add date of birth"
        studentId={student.id}
        type="date"
        value={
          student.dateOfBirth ? formatCalendarDate(student.dateOfBirth) : null
        }
      />
    </ProfileField>
    <ProfileField label="Gender">
      <EditableField
        display={student.gender ? (genderLabels[student.gender] ?? null) : null}
        field="gender"
        label="gender"
        options={GENDER_SELECT_OPTIONS}
        placeholder="Set gender"
        studentId={student.id}
        type="select"
        value={student.gender ?? null}
      />
    </ProfileField>
    <ProfileField label="IC / MyKid number">
      <EditableField
        field="icNumber"
        label="IC / MyKid number"
        placeholder="Add IC / MyKid number"
        studentId={student.id}
        type="text"
        value={student.icNumber}
      />
    </ProfileField>
  </>
);

const SchoolProfileFields = ({
  levels,
  student,
}: {
  readonly levels: readonly LevelOption[];
  readonly student: StudentData;
}) => {
  const levelOptions = [
    ...levels
      .filter((level) => level.stage !== "GENERAL")
      .map((level) => ({ label: level.name, value: level.id })),
    { label: "No level", value: "" },
  ];
  const dueDayOptions = FEE_DUE_DAYS.map((day) => ({
    label: `${day}${ordinalSuffix(day)} of each month`,
    value: day,
  }));

  return (
    <>
      <ProfileField label="Academic level">
        <EditableField
          display={student.level?.name ?? null}
          field="levelId"
          label="academic level"
          options={levelOptions}
          placeholder="Set academic level"
          studentId={student.id}
          type="select"
          value={student.levelId}
        />
      </ProfileField>
      <ProfileField label="School">
        <EditableField
          field="schoolName"
          label="school"
          placeholder="Add school"
          studentId={student.id}
          type="text"
          value={student.schoolName}
        />
      </ProfileField>
      <ProfileField label="Branch">
        <span className="font-medium text-sm">
          {student.branch?.name ?? "-"}
        </span>
      </ProfileField>
      <ProfileField label="Enrolled">
        <EditableField
          display={formatDate(student.enrolledAt)}
          field="enrolledAt"
          label="enrollment date"
          placeholder="Add enrollment date"
          studentId={student.id}
          type="date"
          value={formatCalendarDate(student.enrolledAt)}
        />
      </ProfileField>
      <ProfileField label="Fee due day">
        <EditableField
          display={
            student.invoiceDueDay
              ? `${student.invoiceDueDay}${ordinalSuffix(String(student.invoiceDueDay))} of each month`
              : null
          }
          field="invoiceDueDay"
          label="fee due day"
          options={dueDayOptions}
          placeholder="Set fee due day"
          studentId={student.id}
          type="select"
          value={student.invoiceDueDay ? String(student.invoiceDueDay) : null}
        />
      </ProfileField>
    </>
  );
};

const ContactProfileFields = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <>
    <ProfileField label="Phone">
      <EditableField
        field="phone"
        label="phone"
        placeholder="Add phone number"
        studentId={student.id}
        type="text"
        value={student.phone}
      />
    </ProfileField>
    <ProfileField label="Email">
      <EditableField
        field="email"
        label="email"
        placeholder="Add email address"
        studentId={student.id}
        type="text"
        value={student.email}
      />
    </ProfileField>
    <ProfileField label="Emergency contact name">
      <EditableField
        field="emergencyContactName"
        label="emergency contact name"
        placeholder="Add emergency contact name"
        studentId={student.id}
        type="text"
        value={student.emergencyContactName}
      />
    </ProfileField>
    <ProfileField label="Emergency contact phone">
      <EditableField
        field="emergencyContactPhone"
        label="emergency contact phone"
        placeholder="Add emergency contact phone"
        studentId={student.id}
        type="text"
        value={student.emergencyContactPhone}
      />
    </ProfileField>
    <ProfileField label="Referral source">
      <EditableField
        display={student.referralSource ?? null}
        field="referralSource"
        label="referral source"
        options={REFERRAL_SOURCES.map((source) => ({
          label: source,
          value: source,
        }))}
        placeholder="Set referral source"
        studentId={student.id}
        type="select"
        value={student.referralSource}
      />
    </ProfileField>
  </>
);

const AddressProfileFields = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <>
    <ProfileField label="Address line 1">
      <EditableField
        field="addressLine1"
        label="address line 1"
        placeholder="Add address line 1"
        studentId={student.id}
        type="text"
        value={student.addressLine1}
      />
    </ProfileField>
    <ProfileField label="Address line 2">
      <EditableField
        field="addressLine2"
        label="address line 2"
        placeholder="Add address line 2"
        studentId={student.id}
        type="text"
        value={student.addressLine2}
      />
    </ProfileField>
    <ProfileField label="City">
      <EditableField
        field="city"
        label="city"
        placeholder="Add city"
        studentId={student.id}
        type="text"
        value={student.city}
      />
    </ProfileField>
    <ProfileField label="State">
      <EditableField
        field="state"
        label="state"
        placeholder="Add state"
        studentId={student.id}
        type="text"
        value={student.state}
      />
    </ProfileField>
    <ProfileField label="Postcode">
      <EditableField
        field="postcode"
        label="postcode"
        placeholder="Add postcode"
        studentId={student.id}
        type="text"
        value={student.postcode}
      />
    </ProfileField>
  </>
);

const StudentOverviewTab = ({
  levels,
  student,
}: {
  readonly levels: readonly LevelOption[];
  readonly student: StudentData;
}) => (
  <CardShell>
    <CardHeader>
      <CardTitle>Student Profile</CardTitle>
      <CardDescription>Click any value to edit it inline.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-x-6 gap-y-4 md:grid-cols-2">
      <PersonalProfileFields student={student} />
      <SchoolProfileFields levels={levels} student={student} />
      <ContactProfileFields student={student} />
      <AddressProfileFields student={student} />
    </CardContent>
  </CardShell>
);

const StudentAcademicsTab = ({
  formatMoney,
  student,
}: {
  readonly formatMoney: (amountSen: number) => string;
  readonly student: StudentData;
}) => (
  <CardShell>
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
                {enrollment.class.schedules.length > 0
                  ? enrollment.class.schedules
                      .map(
                        (schedule) =>
                          `${schedule.dayOfWeek} ${formatTime(schedule.startsAt)}-${formatTime(schedule.endsAt)}`
                      )
                      .join(", ")
                  : "No schedule"}
                {enrollment.class.teacher?.fullName
                  ? ` · ${enrollment.class.teacher.fullName}`
                  : ""}
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
  </CardShell>
);

const GuardianCard = ({
  link,
  studentId,
}: {
  readonly link: StudentData["guardians"][number];
  readonly studentId: string;
}) => {
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
    <div className="border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {link.isPrimary ? (
              <EditableField
                field="guardianFullName"
                label="guardian name"
                placeholder="Add guardian name"
                studentId={studentId}
                type="text"
                value={guardian.fullName}
              />
            ) : (
              <p className="font-medium">{guardian.fullName}</p>
            )}
            {link.isPrimary ? <Badge>Primary</Badge> : null}
            {link.receivesBilling ? (
              <Badge variant="secondary">Billing contact</Badge>
            ) : null}
          </div>
          {link.isPrimary ? (
            <div className="mt-1">
              <EditableField
                display={link.relationship || null}
                field="guardianRelationship"
                label="guardian relationship"
                options={RELATIONSHIP_SELECT_OPTIONS}
                placeholder="Set relationship"
                studentId={studentId}
                type="select"
                value={link.relationship ?? null}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{link.relationship}</p>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
          {link.isPrimary ? (
            <EditableField
              field="guardianPhone"
              label="guardian phone"
              placeholder="Add phone number"
              studentId={studentId}
              type="text"
              value={guardian.phone}
            />
          ) : (
            <span>{guardian.phone ?? "-"}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MailIcon className="size-4 shrink-0 text-muted-foreground" />
          {link.isPrimary ? (
            <EditableField
              field="guardianEmail"
              label="guardian email"
              placeholder="Add email address"
              studentId={studentId}
              type="text"
              value={guardian.email}
            />
          ) : (
            <span>{guardian.email ?? "-"}</span>
          )}
        </div>
        {link.isPrimary ? (
          <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
            <ProfileField label="Address line 1">
              <EditableField
                field="guardianAddressLine1"
                label="guardian address line 1"
                placeholder="Add address line 1"
                studentId={studentId}
                type="text"
                value={guardian.addressLine1}
              />
            </ProfileField>
            <ProfileField label="Address line 2">
              <EditableField
                field="guardianAddressLine2"
                label="guardian address line 2"
                placeholder="Add address line 2"
                studentId={studentId}
                type="text"
                value={guardian.addressLine2}
              />
            </ProfileField>
            <ProfileField label="City">
              <EditableField
                field="guardianCity"
                label="guardian city"
                placeholder="Add city"
                studentId={studentId}
                type="text"
                value={guardian.city}
              />
            </ProfileField>
            <ProfileField label="State">
              <EditableField
                field="guardianState"
                label="guardian state"
                placeholder="Add state"
                studentId={studentId}
                type="text"
                value={guardian.state}
              />
            </ProfileField>
            <ProfileField label="Postcode">
              <EditableField
                field="guardianPostcode"
                label="guardian postcode"
                placeholder="Add postcode"
                studentId={studentId}
                type="text"
                value={guardian.postcode}
              />
            </ProfileField>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm md:col-span-2">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{address || "-"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentGuardiansTab = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <CardShell>
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
        student.guardians.map((link) => (
          <GuardianCard key={link.id} link={link} studentId={student.id} />
        ))
      )}
    </CardContent>
  </CardShell>
);

const StudentBillingTab = ({
  formatMoney,
  student,
}: {
  readonly formatMoney: (amountSen: number) => string;
  readonly student: StudentData;
}) => {
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
    <CardShell>
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
    </CardShell>
  );
};

const StudentAttendanceTab = ({
  student,
}: {
  readonly student: StudentData;
}) => (
  <CardShell>
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
  </CardShell>
);

const StudentNotesTab = ({ student }: { readonly student: StudentData }) => (
  <CardShell>
    <CardHeader>
      <CardTitle>Notes</CardTitle>
      <CardDescription>Internal notes and follow-up reminders.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-1">
      <span className="text-muted-foreground text-xs">Internal notes</span>
      <EditableField
        display={
          student.notes ? (
            <span className="whitespace-pre-wrap">{student.notes}</span>
          ) : null
        }
        field="notes"
        label="internal notes"
        placeholder="Add internal notes"
        studentId={student.id}
        type="textarea"
        value={student.notes}
      />
    </CardContent>
  </CardShell>
);

const StudentProfilePage = async ({ params }: StudentPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { studentId } = await params;
  const currency = await getOrganizationCurrency(tenant.organizationId);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  const [student, dashboard, _overview, activities, trends, enrollableClasses, levels] =
    await Promise.all([
      getStudentData(studentId, tenant.organizationId),
      getStudentDashboard(database, {
        organizationId: tenant.organizationId,
        studentId,
      }),
      getStudentOverview(database, {
        organizationId: tenant.organizationId,
        studentId,
      }),
      listStudentActivity(database, tenant.organizationId, studentId),
      getStudentTrends(database, tenant.organizationId, studentId),
      getEnrollableClasses(tenant.organizationId),
      database.level.findMany({
        where: { organizationId: tenant.organizationId, archivedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, name: true, stage: true },
      }),
    ]);

  if (!student) {
    notFound();
  }

  const primaryGuardian = student.guardians.at(0)?.guardian;
  const activeEnrollmentOptions = student.enrollments.map((enrollment) => ({
    className: enrollment.class.name,
    id: enrollment.id,
    subjectName: enrollment.class.subject.name,
  }));
  const totalBilledSen = dashboard?.totalBilledSen ?? 0;
  const totalPaidSen = dashboard?.totalPaidSen ?? 0;
  const outstandingSen = dashboard?.outstandingSen ?? 0;
  const activeEnrollments = dashboard?.activeEnrollmentCount ?? 0;
  const attendanceRate = dashboard?.attendanceRate ?? 0;

  return (
    <>
      <Header
        page="Student Information"
        pages={[`${appName}`, { href: "/students", label: "Students" }]}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Student Information
          </h1>
          <p className="text-muted-foreground text-sm">
            View student profile details, guardian contacts, class
            enrollments, billing, and attendance.
          </p>
        </div>

        <section className="grid gap-5">
          <section className="grid content-start gap-5">
            <StudentHeader
              primaryGuardianPhone={primaryGuardian?.phone ?? undefined}
              student={student}
            />

            <StudentQuickActions
              activeEnrollments={activeEnrollmentOptions}
              classes={enrollableClasses}
              currency={currency}
              studentId={student.id}
            />

            <StudentMetrics
              activeEnrollments={activeEnrollments}
              attendanceRate={attendanceRate}
              formatMoney={formatMoney}
              outstandingSen={outstandingSen}
              totalBilledSen={totalBilledSen}
              totalPaidSen={totalPaidSen}
            />

            <Tabs className="gap-4" defaultValue="overview">
              <TabsList className="grid h-auto w-full grid-cols-4 md:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="guardians">Guardians</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent className="grid gap-5" value="overview">
                <StudentOverviewTab levels={levels} student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="activity">
                <StudentActivityTimeline activities={activities} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="analytics">
                {trends ? (
                  <StudentAnalyticsTab currency={currency} trends={trends} />
                ) : null}
              </TabsContent>
              <TabsContent className="grid gap-5" value="academics">
                <StudentAcademicsTab
                  formatMoney={formatMoney}
                  student={student}
                />
              </TabsContent>
              <TabsContent className="grid gap-5" value="guardians">
                <StudentGuardiansTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="billing">
                <StudentBillingTab
                  formatMoney={formatMoney}
                  student={student}
                />
              </TabsContent>
              <TabsContent className="grid gap-5" value="attendance">
                <StudentAttendanceTab student={student} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="notes">
                <StudentNotesTab student={student} />
              </TabsContent>
            </Tabs>
          </section>
        </section>
      </main>
    </>
  );
};

export default StudentProfilePage;
