import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MoreHorizontalIcon,
  SearchIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
  UserRoundXIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { archiveTeacher } from "./actions";

interface TeachersPageProperties {
  readonly searchParams?: Promise<{ teacherId?: string }>;
}

const teacherCode = (index: number) =>
  `TCH-${String(index + 1).padStart(3, "0")}`;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const TeachersPage = async ({ searchParams }: TeachersPageProperties) => {
  const tenant = await requireTenant();
  const params = await searchParams;
  const [teachers, archivedTeachers] = await Promise.all([
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
      include: {
        branch: true,
        classes: {
          where: { archivedAt: null },
          include: {
            branch: true,
            enrollments: {
              where: { archivedAt: null, status: "ACTIVE" },
              select: { id: true },
            },
            subject: true,
          },
        },
      },
    }),
    database.teacherProfile.count({
      where: {
        organizationId: tenant.organizationId,
        archivedAt: { not: null },
      },
    }),
  ]);

  const selectedTeacher =
    teachers.find((teacher) => teacher.id === params?.teacherId) ??
    teachers.at(0);
  const selectedTeacherIndex = selectedTeacher
    ? teachers.findIndex((teacher) => teacher.id === selectedTeacher.id)
    : -1;
  const selectedSubjects = selectedTeacher
    ? Array.from(
        new Set(
          selectedTeacher.classes.map(
            (learningClass) => learningClass.subject.name
          )
        )
      )
    : [];
  const selectedStudentsCount = selectedTeacher
    ? selectedTeacher.classes.reduce(
        (total, learningClass) => total + learningClass.enrollments.length,
        0
      )
    : 0;
  const assignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length > 0
  );
  const unassignedTeachers = teachers.filter(
    (teacher) => teacher.classes.length === 0
  );
  const totalTeachers = teachers.length + archivedTeachers;

  return (
    <>
      <Header page="Teachers" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Teachers</h1>
            <p className="text-muted-foreground text-sm">
              Manage teacher profiles, assignments, and contact details.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_380px]">
          <section className="grid content-start gap-5">
            <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {[
                {
                  color: "info" as const,
                  detail: `${teachers.length} active profiles`,
                  icon: UsersRoundIcon,
                  label: "Total Teachers",
                  value: totalTeachers.toLocaleString(),
                },
                {
                  color: "success" as const,
                  detail: `${totalTeachers > 0 ? Math.round((teachers.length / totalTeachers) * 100) : 0}% of total`,
                  icon: UserRoundCheckIcon,
                  label: "Active Teachers",
                  value: teachers.length.toLocaleString(),
                },
                {
                  color: "default" as const,
                  detail: `${teachers.length > 0 ? Math.round((assignedTeachers.length / teachers.length) * 100) : 0}% with classes`,
                  icon: UserRoundIcon,
                  label: "Assigned Teachers",
                  value: assignedTeachers.length.toLocaleString(),
                },
                {
                  color: "warning" as const,
                  detail: `${unassignedTeachers.length} active unassigned`,
                  icon: UserRoundXIcon,
                  label: "Inactive Teachers",
                  value: archivedTeachers.toLocaleString(),
                },
              ].map(({ color, detail, icon: Icon, label, value }) => (
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
                        placeholder="Search teachers..."
                      />
                    </div>
                    {[
                      ["Status", "All Status"],
                      ["Subject", "All Subjects"],
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
                      More Filters
                    </Button>
                    <Button asChild className="ml-auto">
                      <Link href="/teachers/new">Add Teacher</Link>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher, index) => {
                        const subjects = Array.from(
                          new Set(
                            teacher.classes.map(
                              (learningClass) => learningClass.subject.name
                            )
                          )
                        );
                        const isSelected = teacher.id === selectedTeacher?.id;

                        return (
                          <TableRow
                            className={isSelected ? "bg-muted/50" : undefined}
                            key={teacher.id}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                  <UserRoundIcon className="size-5" />
                                </div>
                                <div className="grid gap-0.5">
                                  <Link
                                    className="font-medium hover:underline"
                                    href={`/teachers?teacherId=${teacher.id}`}
                                  >
                                    {teacher.fullName}
                                  </Link>
                                  <span className="text-muted-foreground text-xs">
                                    {teacherCode(index)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex max-w-56 flex-wrap gap-1.5">
                                {subjects.length > 0 ? (
                                  subjects.slice(0, 3).map((subject) => (
                                    <Badge key={subject} variant="secondary">
                                      {subject}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{teacher.classes.length}</TableCell>
                            <TableCell>{teacher.phone ?? "-"}</TableCell>
                            <TableCell>{teacher.email ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button asChild size="icon" variant="outline">
                                  <Link
                                    href={`/teachers?teacherId=${teacher.id}`}
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </Link>
                                </Button>
                                <form action={archiveTeacher}>
                                  <input
                                    name="teacherId"
                                    type="hidden"
                                    value={teacher.id}
                                  />
                                  <Button
                                    size="sm"
                                    type="submit"
                                    variant="outline"
                                  >
                                    Archive
                                  </Button>
                                </form>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-3 border-t p-4 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between">
                  <p>
                    Showing 1 to {teachers.length} of {teachers.length} teachers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline">
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    {[1, 2, 3].map((page) => (
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
              {selectedTeacher ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                        <UserRoundIcon className="size-10" />
                      </div>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {selectedTeacher.fullName}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                        <span>
                          {selectedTeacherIndex >= 0
                            ? teacherCode(selectedTeacherIndex)
                            : "TCH-000"}
                        </span>
                        <span>+</span>
                        <span>
                          {selectedTeacher.branch?.name ?? "No branch"}
                        </span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline">
                        <Link
                          href={`https://wa.me/${selectedTeacher.phone ?? ""}`}
                        >
                          WhatsApp
                        </Link>
                      </Button>
                      <Button variant="outline">More</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-5 p-0">
                    <section className="grid gap-3 border-b p-4">
                      <h2 className="font-semibold text-sm">
                        Teacher Information
                      </h2>
                      {[
                        ["Joined", formatDate(selectedTeacher.createdAt)],
                        ["Phone", selectedTeacher.phone ?? "-"],
                        ["Email", selectedTeacher.email ?? "-"],
                        ["Branch", selectedTeacher.branch?.name ?? "-"],
                        ["Status", "Active"],
                      ].map(([label, value]) => (
                        <div
                          className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                          key={label}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </section>
                    <section className="grid gap-3 border-b p-4">
                      <h2 className="font-semibold text-sm">Teaching Load</h2>
                      {[
                        ["Classes", selectedTeacher.classes.length],
                        ["Subjects", selectedSubjects.join(", ") || "-"],
                        ["Students", selectedStudentsCount],
                      ].map(([label, value]) => (
                        <div
                          className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                          key={label}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </section>
                    <section className="grid gap-3 p-4">
                      <h2 className="font-semibold text-sm">Notes</h2>
                      <p className="text-muted-foreground text-sm">
                        {selectedTeacher.notes ?? "No notes recorded."}
                      </p>
                    </section>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No teachers to display.
                </CardContent>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
};

export default TeachersPage;
