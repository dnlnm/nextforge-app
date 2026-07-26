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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
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
import { Header } from "../components/header";
import { createClassSession, markAttendance } from "./actions";

const statusLabels: Record<AttendanceStatus, string> = {
  ABSENT: "Absent",
  EXCUSED: "Excused",
  LATE: "Late",
  PRESENT: "Present",
};

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(date);

const AttendancePage = async () => {
  const tenant = await requireTenant();
  const [classes, sessions] = await Promise.all([
    database.learningClass.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
      include: { subject: true },
    }),
    database.classSession.findMany({
      where: { organizationId: tenant.organizationId },
      orderBy: [{ sessionDate: "desc" }, { startsAt: "asc" }],
      take: 10,
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
      <Header page="Attendance" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Create session</CardTitle>
            <CardDescription>
              Create the class session to mark attendance for a selected date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createClassSession} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="classId">Class</Label>
                <Select name="classId" required>
                  <SelectTrigger id="classId">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {item.subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessionDate">Date</Label>
                <Input
                  defaultValue={today()}
                  id="sessionDate"
                  name="sessionDate"
                  required
                  type="date"
                />
              </div>
              <Button disabled={classes.length === 0} type="submit">
                Create session
              </Button>
            </form>
          </CardContent>
        </Card>
        <section className="grid gap-4">
          {sessions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No sessions yet</CardTitle>
                <CardDescription>
                  Create a class session to start marking attendance.
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
                        {formatDate(session.sessionDate)} - {session.startsAt}{" "}
                        to {session.endsAt} - {session.class.subject.name}
                        {session.class.teacher
                          ? ` - ${session.class.teacher.fullName}`
                          : ""}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        session.status === "COMPLETED" ? "default" : "secondary"
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
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
        </section>
      </main>
    </>
  );
};

export default AttendancePage;
