import { requireTenant } from "@repo/auth/authorization";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  markAttendance,
  markSessionAttendanceStatus,
} from "../attendance/actions";
import { Header } from "../components/header";
import { createTodaySessions } from "./actions";
import { getMalaysiaDateParts } from "./date";

const statusLabels: Record<AttendanceStatus, string> = {
  ABSENT: "Absent",
  EXCUSED: "Excused",
  LATE: "Late",
  PRESENT: "Present",
};

const TodayPage = async () => {
  const tenant = await requireTenant();
  const today = getMalaysiaDateParts();
  const user = await database.user.findUnique({
    where: { id: tenant.userId },
    select: { email: true },
  });
  const teacher =
    tenant.role === "TEACHER" && user?.email
      ? await database.teacherProfile.findFirst({
          where: {
            archivedAt: null,
            email: { equals: user.email, mode: "insensitive" },
            organizationId: tenant.organizationId,
          },
          select: { fullName: true, id: true },
        })
      : null;
  const teacherClassFilter =
    tenant.role === "TEACHER" ? { teacherId: teacher?.id ?? "__none__" } : {};
  const [todayClassCount, sessions] = await Promise.all([
    database.learningClass.count({
      where: {
        organizationId: tenant.organizationId,
        dayOfWeek: today.dayOfWeek,
        status: "ACTIVE",
        ...teacherClassFilter,
      },
    }),
    database.classSession.findMany({
      where: {
        organizationId: tenant.organizationId,
        sessionDate: today.date,
        ...(tenant.role === "TEACHER"
          ? { class: { teacherId: teacher?.id ?? "__none__" } }
          : {}),
      },
      orderBy: { startsAt: "asc" },
      include: {
        attendance: true,
        class: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: true },
              orderBy: { student: { fullName: "asc" } },
            },
            subject: true,
            teacher: true,
          },
        },
      },
    }),
  ]);

  return (
    <>
      <Header page="Today" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s classes</CardTitle>
            <CardDescription>
              {today.dayOfWeek.toLowerCase()} in Malaysia. {todayClassCount}{" "}
              active classes match today&apos;s schedule
              {tenant.role === "TEACHER" && teacher
                ? ` for ${teacher.fullName}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {tenant.role === "TEACHER" && !teacher ? (
                <p className="text-muted-foreground text-sm">
                  Your login email is not linked to a teacher profile yet. Ask
                  an admin to set your teacher profile email to{" "}
                  {user?.email ?? "your login email"}.
                </p>
              ) : null}
              <form action={createTodaySessions}>
                <Button
                  disabled={tenant.role === "TEACHER" && !teacher}
                  type="submit"
                >
                  Create today&apos;s sessions
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
        {sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No sessions for today</CardTitle>
              <CardDescription>
                Create today&apos;s sessions if classes are scheduled, or check
                the class schedule and teacher assignment.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {sessions.map((session) => {
          const attendanceByStudent = new Map(
            session.attendance.map((record) => [record.studentId, record])
          );

          return (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{session.class.name}</CardTitle>
                    <CardDescription>
                      {session.startsAt}-{session.endsAt} -{" "}
                      {session.class.subject.name}
                      {session.class.teacher
                        ? ` - ${session.class.teacher.fullName}`
                        : ""}
                    </CardDescription>
                  </div>
                  <Badge>{session.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <form action={markSessionAttendanceStatus} key={value}>
                      <input
                        name="sessionId"
                        type="hidden"
                        value={session.id}
                      />
                      <input name="status" type="hidden" value={value} />
                      <Button
                        disabled={session.class.enrollments.length === 0}
                        size="sm"
                        type="submit"
                        variant={value === "PRESENT" ? "default" : "outline"}
                      >
                        Mark all {label.toLowerCase()}
                      </Button>
                    </form>
                  ))}
                </div>
                <form action={markAttendance} className="grid gap-4">
                  <input name="sessionId" type="hidden" value={session.id} />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.class.enrollments.map((enrollment) => {
                        const existing = attendanceByStudent.get(
                          enrollment.studentId
                        );

                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.student.fullName}
                            </TableCell>
                            <TableCell>
                              <Select
                                defaultValue={existing?.status ?? "PRESENT"}
                                name={`status:${enrollment.studentId}`}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(statusLabels).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <Button
                    disabled={session.class.enrollments.length === 0}
                    type="submit"
                  >
                    Save attendance
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </>
  );
};

export default TodayPage;
