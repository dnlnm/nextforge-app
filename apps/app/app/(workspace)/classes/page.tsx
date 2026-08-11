import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  PlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { ClassesTable } from "./components/classes-table";

const dayLabel: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const formatTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number.parseInt(hour, 10), Number.parseInt(minute, 10), 0, 0);

  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

interface ScheduleSummaryItem {
  readonly dayOfWeek: string;
  readonly endsAt: string;
  readonly room: { readonly name: string } | null;
  readonly startsAt: string;
}

const ScheduleSummary = ({
  schedules,
  className = "",
}: {
  schedules: ScheduleSummaryItem[];
  className?: string;
}) => {
  if (schedules.length === 0) {
    return <span className={className}>No schedule</span>;
  }

  return (
    <div className={className}>
      {schedules.map((schedule) => (
        <span className="block" key={schedule.dayOfWeek}>
          {dayLabel[schedule.dayOfWeek]}, {formatTime(schedule.startsAt)} -{" "}
          {formatTime(schedule.endsAt)}
          {schedule.room ? ` (${schedule.room.name})` : ""}
        </span>
      ))}
    </div>
  );
};

const ClassesPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classes = await database.learningClass.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      branch: true,
      enrollments: {
        where: { archivedAt: null, status: "ACTIVE" },
        select: { id: true },
      },
      schedules: {
        orderBy: { dayOfWeek: "asc" },
        include: { room: true },
      },
      subject: true,
      teacher: true,
      level: true,
    },
  });

  const activeClasses = classes.filter((item) => item.status === "ACTIVE");
  const totalEnrollments = classes.reduce(
    (total, item) => total + item.enrollments.length,
    0
  );
  const averageClassSize =
    classes.length > 0 ? totalEnrollments / classes.length : 0;
  const subjectDistribution = Array.from(
    classes
      .reduce((map, item) => {
        map.set(item.subject.name, (map.get(item.subject.name) ?? 0) + 1);

        return map;
      }, new Map<string, number>())
      .entries()
  )
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 6);
  const upcomingClasses = classes
    .slice()
    .sort((first, second) =>
      (first.schedules.at(0)?.startsAt ?? "").localeCompare(
        second.schedules.at(0)?.startsAt ?? ""
      )
    )
    .slice(0, 3);
  const metrics: {
    color: "default" | "info" | "success" | "warning";
    detail: string;
    Icon: LucideIcon;
    label: string;
    value: string;
  }[] = [
    {
      color: "info",
      detail: "+ 5 this month",
      Icon: BookOpenIcon,
      label: "Total Classes",
      value: classes.length.toLocaleString(),
    },
    {
      color: "success",
      detail: `${classes.length > 0 ? Math.round((activeClasses.length / classes.length) * 100) : 0}% of total`,
      Icon: CheckCircle2Icon,
      label: "Active Classes",
      value: activeClasses.length.toLocaleString(),
    },
    {
      color: "default",
      detail: "+ 24 this month",
      Icon: UsersRoundIcon,
      label: "Total Enrolled Students",
      value: totalEnrollments.toLocaleString(),
    },
    {
      color: "warning",
      detail: "Target: 15 - 20",
      Icon: BarChart3Icon,
      label: "Average Class Size",
      value: averageClassSize.toFixed(1),
    },
  ];

  return (
    <>
      <Header page="Classes" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Classes</h1>
            <p className="text-muted-foreground text-sm">
              Manage tuition classes, schedules and teachers.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
          <section className="grid content-start gap-5">
            <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {metrics.map(({ color, detail, Icon, label, value }) => (
                <Stat className="h-full" key={label}>
                  <StatLabel>{label}</StatLabel>
                  <StatIndicator color={color} variant="icon">
                    <Icon />
                  </StatIndicator>
                  <StatValue>{value}</StatValue>
                  <StatDescription>{detail}</StatDescription>
                </Stat>
              ))}
            </section>

            <Card>
              <CardContent className="p-0">
                <ClassesTable
                  classes={classes.map((item) => ({
                    id: item.id,
                    name: item.name,
                    code: item.code,
                    status: item.status,
                    capacity: item.capacity,
                    subject: item.subject,
                    level: item.level,
                    teacher: item.teacher,
                    schedules: item.schedules.map((schedule) => ({
                      dayOfWeek: schedule.dayOfWeek,
                      endsAt: schedule.endsAt,
                      startsAt: schedule.startsAt,
                      room: schedule.room,
                    })),
                    enrollments: item.enrollments,
                  }))}
                />
              </CardContent>
            </Card>
          </section>

          <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
            <Card>
              <CardContent className="grid gap-5 p-4">
                <h2 className="font-semibold text-sm">
                  Class Subject Distribution
                </h2>
                <div className="mx-auto flex size-36 items-center justify-center rounded-full border-[18px] border-muted bg-background text-center">
                  <div>
                    <p className="font-semibold text-2xl">
                      {classes.length.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Total Classes
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {subjectDistribution.map(([subject, count]) => (
                    <div
                      className="grid grid-cols-[1fr_auto] gap-3 text-sm"
                      key={subject}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground/50" />
                        {subject}
                      </span>
                      <span className="text-muted-foreground">
                        {count} (
                        {classes.length > 0
                          ? ((count / classes.length) * 100).toFixed(1)
                          : "0.0"}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-sm">Upcoming Classes</h2>
                  <Button size="sm" variant="ghost">
                    View All
                  </Button>
                </div>
                <div className="grid gap-3">
                  {upcomingClasses.map((item) => (
                    <div
                      className="flex gap-3 border-b pb-3 last:border-b-0"
                      key={item.id}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
                        <CalendarIcon className="size-5" />
                      </div>
                      <div className="grid gap-1 text-sm">
                        <p className="font-medium">{item.name}</p>
                        <ScheduleSummary
                          className="text-muted-foreground"
                          schedules={item.schedules}
                        />
                        <p className="text-muted-foreground">
                          {item.schedules.at(0)?.room?.name ??
                            item.branch?.name ??
                            "No room assigned"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-3 p-4">
                <h2 className="font-semibold text-sm">Quick Actions</h2>
                <Button asChild>
                  <Link href="/classes/new">
                    <PlusIcon className="size-4" />
                    Add New Class
                  </Link>
                </Button>
                <Button variant="outline">
                  <CalendarIcon className="size-4" />
                  Generate Timetable
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
};

export default ClassesPage;
