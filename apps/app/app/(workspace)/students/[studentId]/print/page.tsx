import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { formatShortDate, formatWallClockTime } from "@repo/date";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Separator } from "@repo/design-system/components/ui/separator";
import { notFound } from "next/navigation";

interface PrintStudentPageProperties {
  readonly params: Promise<{ studentId: string }>;
}

const formatDate = (date: Date) => formatShortDate(date);

const formatTime = (value: string) => formatWallClockTime(value);

const PrintStudentPage = async ({ params }: PrintStudentPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { studentId } = await params;

  const student = await database.student.findFirst({
    where: { id: studentId, organizationId: tenant.organizationId },
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
              schedules: true,
              subject: true,
              teacher: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const primaryGuardian = student.guardians.at(0)?.guardian;

  return (
    <main className="mx-auto max-w-3xl p-8 text-sm print:p-0">
      <header className="mb-6">
        <h1 className="font-semibold text-2xl tracking-tight">
          Student Profile
        </h1>
        <p className="text-muted-foreground">
          {student.fullName} · {student.code}
        </p>
      </header>

      <section className="grid gap-4">
        <CardShell>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            <Detail label="Full name" value={student.fullName} />
            <Detail label="Student code" value={student.code} />
            <Detail label="Gender" value={student.gender ?? "-"} />
            <Detail
              label="Date of birth"
              value={
                student.dateOfBirth ? formatDate(student.dateOfBirth) : "-"
              }
            />
            <Detail label="School" value={student.schoolName ?? "-"} />
            <Detail label="Enrolled" value={formatDate(student.enrolledAt)} />
            <Detail label="Branch" value={student.branch?.name ?? "-"} />
            <Detail label="Academic level" value={student.level?.name ?? "-"} />
            <Detail label="Phone" value={student.phone ?? "-"} />
            <Detail label="Email" value={student.email ?? "-"} />
            <div className="md:col-span-2">
              <Detail
                label="Address"
                value={
                  [
                    student.addressLine1,
                    student.addressLine2,
                    student.city,
                    student.state,
                    student.postcode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"
                }
              />
            </div>
          </CardContent>
        </CardShell>

        <CardShell>
          <CardHeader>
            <CardTitle>Primary Guardian</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            <Detail label="Name" value={primaryGuardian?.fullName ?? "-"} />
            <Detail
              label="Relationship"
              value={student.guardians.at(0)?.relationship ?? "-"}
            />
            <Detail label="Phone" value={primaryGuardian?.phone ?? "-"} />
            <Detail label="Email" value={primaryGuardian?.email ?? "-"} />
          </CardContent>
        </CardShell>

        <CardShell>
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {student.enrollments.length === 0 ? (
              <p className="text-muted-foreground">
                No active class enrollments.
              </p>
            ) : (
              student.enrollments.map((enrollment) => (
                <div className="grid gap-1 border p-3" key={enrollment.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{enrollment.class.name}</span>
                    <span className="text-muted-foreground">
                      {enrollment.class.subject.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                    <span>
                      Teacher:{" "}
                      {enrollment.class.teacher?.fullName ?? "Unassigned"}
                    </span>
                    {enrollment.class.schedules.length > 0 ? (
                      <span>
                        ·{" "}
                        {enrollment.class.schedules
                          .map(
                            (schedule) =>
                              `${schedule.dayOfWeek} ${formatTime(schedule.startsAt)}-${formatTime(schedule.endsAt)}`
                          )
                          .join(", ")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </CardShell>
      </section>

      <Separator className="my-6 print:hidden" />
      <p className="text-center text-muted-foreground text-xs print:hidden">
        Generated on {formatDate(new Date())}. Use your browser&apos;s print
        command to save or share this profile.
      </p>
    </main>
  );
};

const Detail = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div className="grid gap-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default PrintStudentPage;
