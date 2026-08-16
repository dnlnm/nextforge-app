import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { type DayOfWeek, database } from "@repo/database";
import { formatShortDate, formatWallClockTime } from "@repo/date";
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
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { getTeacherTrends } from "@repo/domain/analytics";
import { workloadCategoryLabel } from "@repo/domain/metrics";
import { getTeacherDashboard } from "@repo/domain/teachers/dashboard";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";

interface TeacherPageProperties {
  readonly params: Promise<{ teacherId: string }>;
}

const DAY_ORDER: DayOfWeek[] = [
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

const formatTime = (value: string) => formatWallClockTime(value);

const formatDate = (date: Date) => formatShortDate(date);

const workloadBarColor = (category: string | undefined): string => {
  switch (category) {
    case "HEAVY":
      return "h-full bg-destructive";
    case "MEDIUM":
      return "h-full bg-orange-500";
    default:
      return "h-full bg-success";
  }
};

const TeacherPage = async ({ params }: TeacherPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { teacherId } = await params;

  const [teacher, dashboard, trends] = await Promise.all([
    database.teacherProfile.findFirst({
      where: {
        archivedAt: null,
        id: teacherId,
        organizationId: tenant.organizationId,
      },
      include: {
        branch: true,
        classes: {
          where: { archivedAt: null, status: "ACTIVE" },
          include: {
            branch: true,
            schedules: {
              orderBy: { dayOfWeek: "asc" },
              include: { room: { select: { name: true } } },
            },
            subject: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
    getTeacherDashboard(database, {
      organizationId: tenant.organizationId,
      teacherId,
    }),
    getTeacherTrends(database, tenant.organizationId, teacherId),
  ]);

  if (!teacher) {
    notFound();
  }

  const subjectNames = Array.from(
    new Set(teacher.classes.map((c) => c.subject.name))
  ).sort();

  return (
    <>
      <Header
        page="Teacher"
        pages={[`${appName}`, { href: "/teachers", label: "Teachers" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <Card>
          <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                <UserRoundIcon className="size-10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
                    <span className="text-balance">{teacher.fullName}</span>
                  </h1>
                  <Badge variant="outline">{teacher.code}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                  <span>{teacher.branch?.name ?? "No branch assigned"}</span>
                  <span>•</span>
                  <span>Joined {formatDate(teacher.createdAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {teacher.phone ? (
                    <Badge variant="secondary">
                      <PhoneIcon className="size-3" />
                      {teacher.phone}
                    </Badge>
                  ) : null}
                  {teacher.email ? (
                    <Badge variant="secondary">
                      <MailIcon className="size-3" />
                      {teacher.email}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:w-auto md:min-w-[16rem]">
              <Button
                variant="outline"
                render={<Link href={`https://wa.me/${teacher.phone ?? ""}`} />}
              >
                <PhoneIcon className="size-4" />
                WhatsApp
              </Button>
              <Button variant="outline" render={<Link href="/teachers" />}>
                Back to teachers
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat>
            <StatPanel>
              <StatLabel>Students</StatLabel>
              <StatIndicator color="info" variant="icon">
                <UsersRoundIcon />
              </StatIndicator>
              <StatValue>{dashboard?.distinctStudentCount ?? 0}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Distinct active students</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Classes</StatLabel>
              <StatIndicator color="success" variant="icon">
                <CalendarDaysIcon />
              </StatIndicator>
              <StatValue>{dashboard?.activeClassCount ?? 0}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Active classes</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Weekly hours</StatLabel>
              <StatIndicator color="warning" variant="icon">
                <ClockIcon />
              </StatIndicator>
              <StatValue>{dashboard?.weeklyTeachingHours ?? 0}h</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Per week</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Subjects</StatLabel>
              <StatIndicator color="default" variant="icon">
                <BookOpenIcon />
              </StatIndicator>
              <StatValue>{dashboard?.distinctSubjectCount ?? 0}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>
                {subjectNames.join(", ") || "None"}
              </StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Completion</StatLabel>
              <StatIndicator color="default" variant="icon">
                <CalendarDaysIcon />
              </StatIndicator>
              <StatValue>
                {trends?.attendanceCompletionRate === null ||
                trends?.attendanceCompletionRate === undefined
                  ? "No data"
                  : `${trends.attendanceCompletionRate}%`}
              </StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>For created sessions</StatDescription>
            </StatFooter>
          </Stat>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Workload</CardTitle>
            <CardDescription>
              {dashboard
                ? workloadCategoryLabel(dashboard.workloadCategory)
                : "No active classes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={workloadBarColor(dashboard?.workloadCategory)}
                  style={{
                    width: `${Math.min(100, ((dashboard?.activeClassCount ?? 0) / 15) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-muted-foreground text-sm">
                {dashboard?.activeClassCount ?? 0} of 15 reference classes
              </span>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Monday to Sunday timetable from class schedules.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {DAY_ORDER.map((day) => {
                const daySchedules = teacher.classes.flatMap((learningClass) =>
                  learningClass.schedules
                    .filter((schedule) => schedule.dayOfWeek === day)
                    .map((schedule) => ({
                      className: learningClass.name,
                      endsAt: schedule.endsAt,
                      roomName: schedule.room?.name ?? null,
                      startsAt: schedule.startsAt,
                      subjectName: learningClass.subject.name,
                    }))
                    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                );

                return (
                  <div
                    className="grid grid-cols-[3.5rem_1fr] gap-2 border-b py-2 last:border-b-0"
                    key={day}
                  >
                    <span className="pt-1 font-medium text-muted-foreground text-xs">
                      {dayShortLabel[day]}
                    </span>
                    <div className="grid gap-1.5">
                      {daySchedules.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          No classes
                        </p>
                      ) : (
                        daySchedules.map((schedule) => (
                          <div
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
                            key={`${schedule.className}-${schedule.startsAt}`}
                          >
                            <span className="font-medium">
                              {schedule.className} · {schedule.subjectName}
                            </span>
                            <span className="text-muted-foreground">
                              {formatTime(schedule.startsAt)} -{" "}
                              {formatTime(schedule.endsAt)}
                              {schedule.roomName
                                ? ` · ${schedule.roomName}`
                                : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>Classes taught by this teacher.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {teacher.classes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No active classes assigned.
                </p>
              ) : (
                teacher.classes.map((learningClass) => (
                  <Link
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                    href={`/classes/${learningClass.id}`}
                    key={learningClass.id}
                  >
                    <span className="font-medium">{learningClass.name}</span>
                    <span className="text-muted-foreground">
                      {learningClass.subject.name}
                      {learningClass.branch?.name
                        ? ` · ${learningClass.branch.name}`
                        : ""}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default TeacherPage;
