import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
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
import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";

const dayLabel: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const whitespaceRegex = /\s+/;
const nonAlphanumericRegex = /[^a-zA-Z0-9]/g;

const formatTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number.parseInt(hour, 10), Number.parseInt(minute, 10), 0, 0);

  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const classCode = (name: string, index: number) => {
  const prefix = name
    .split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(nonAlphanumericRegex, "").slice(0, 4))
    .filter(Boolean)
    .join("-")
    .toUpperCase();

  return `${prefix || "CLS"}-${String(index + 1).padStart(2, "0")}`;
};

const teacherInitials = (name?: string | null) =>
  name
    ?.split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase() || "--";

const ClassesPage = async () => {
  const tenant = await requireTenant();
  const classes = await database.learningClass.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
    include: {
      branch: true,
      enrollments: {
        where: { archivedAt: null, status: "ACTIVE" },
        select: { id: true },
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
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
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
      <Header page="Classes" pages={["TLAS.MY"]} />
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
                <div className="grid gap-4 p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="relative min-w-64 flex-1 sm:max-w-sm">
                      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search classes by name, code or subject..."
                      />
                    </div>
                    {[
                      ["Subject", "All Subjects"],
                      ["Level", "All Levels"],
                    ].map(([label, value]) => (
                      <div className="grid w-36 gap-1" key={label}>
                        <span className="text-muted-foreground text-xs">
                          {label}
                        </span>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder={value} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{value}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <Button variant="outline">
                      <FilterIcon className="size-4" />
                      Filters
                    </Button>
                    <Button asChild className="ml-auto">
                      <Link href="/classes/new">
                        <PlusIcon className="size-4" />
                        Add New Class
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <Link
                                className="font-medium hover:underline"
                                href={`/classes/${item.id}`}
                              >
                                {item.name}
                              </Link>
                              <span className="text-muted-foreground text-xs">
                                {classCode(item.name, index)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.subject.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.level?.name ?? "General"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground text-xs">
                                {teacherInitials(item.teacher?.fullName)}
                              </div>
                              <span>{item.teacher?.fullName ?? "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <span>{dayLabel[item.dayOfWeek]}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatTime(item.startsAt)} -{" "}
                                {formatTime(item.endsAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.enrollments.length} / {item.capacity ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.status === "ACTIVE" ? "Active" : "Upcoming"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button asChild size="icon" variant="outline">
                                <Link href={`/classes/${item.id}`}>
                                  <MoreHorizontalIcon className="size-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-3 border-t p-4 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between">
                  <p>
                    Showing 1 to {classes.length} of {classes.length} classes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline">
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        size="icon"
                        variant={page === 1 ? "default" : "outline"}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button size="icon" variant="outline">
                      <ChevronRightIcon className="size-4" />
                    </Button>
                    <Select defaultValue="10">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                        <p className="text-muted-foreground">
                          {dayLabel[item.dayOfWeek]},{" "}
                          {formatTime(item.startsAt)} -{" "}
                          {formatTime(item.endsAt)}
                        </p>
                        <p className="text-muted-foreground">
                          {item.room ?? item.branch?.name ?? "No room assigned"}
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
