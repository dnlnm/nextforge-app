import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
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
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import {
  ArchiveIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  Edit3Icon,
  LandmarkIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Balancer from "react-wrap-balancer";
import { Header } from "../../components/header";
import { archiveSubject } from "../actions";

interface SubjectPageProperties {
  readonly params: Promise<{ subjectId: string }>;
}

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

const formatTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number.parseInt(hour, 10), Number.parseInt(minute, 10), 0, 0);

  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const teacherInitials = (name?: string | null) =>
  name
    ?.split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase() || "--";

const getSubjectData = async (subjectId: string, organizationId: string) =>
  database.subject.findFirst({
    where: { id: subjectId, organizationId, status: "ACTIVE" },
    include: {
      classes: {
        where: { archivedAt: null },
          include: {
            branch: true,
            level: true,
            enrollments: {
              where: { archivedAt: null, status: "ACTIVE" },
              include: {
                student: {
                  select: {
                    fullName: true,
                    id: true,
                    level: { select: { name: true } },
                    status: true,
                  },
                },
              },
            },
            teacher: {
              select: { fullName: true, id: true },
            },
          },
        orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
      },
    },
  });

type SubjectData = NonNullable<Awaited<ReturnType<typeof getSubjectData>>>;

const SubjectHeader = ({ subject }: { readonly subject: SubjectData }) => (
  <Card>
    <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
          <BookOpenIcon className="size-10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
              <Balancer>{subject.name}</Balancer>
            </h1>
            <Badge variant="outline">
              {subject.status === "ACTIVE" ? "Active" : "Archived"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{subject.classes.length} classes</span>
          </div>
          {subject.description ? (
            <p className="mt-3 max-w-2xl text-muted-foreground text-sm">
              {subject.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:w-auto md:min-w-[18rem]">
        <Button asChild variant="outline">
          <Link href={`/subjects/${subject.id}/edit`}>
            <Edit3Icon className="size-4" />
            Edit subject
          </Link>
        </Button>
        <form action={archiveSubject}>
          <input name="subjectId" type="hidden" value={subject.id} />
          <Button variant="outline">
            <ArchiveIcon className="size-4" />
            Archive subject
          </Button>
        </form>
      </div>
    </CardContent>
  </Card>
);

const SubjectMetrics = ({
  classes,
  students,
  teachers,
}: {
  readonly classes: number;
  readonly students: number;
  readonly teachers: number;
}) => (
  <section className="grid gap-3 md:grid-cols-3">
    <Stat>
      <StatLabel>Classes</StatLabel>
      <StatIndicator color="info" variant="icon">
        <BookOpenIcon />
      </StatIndicator>
      <StatValue>{classes}</StatValue>
      <StatDescription>Active classes</StatDescription>
    </Stat>
    <Stat>
      <StatLabel>Students</StatLabel>
      <StatIndicator color="success" variant="icon">
        <UsersRoundIcon />
      </StatIndicator>
      <StatValue>{students}</StatValue>
      <StatDescription>Actively enrolled</StatDescription>
    </Stat>
    <Stat>
      <StatLabel>Teachers</StatLabel>
      <StatIndicator color="warning" variant="icon">
        <UserRoundIcon />
      </StatIndicator>
      <StatValue>{teachers}</StatValue>
      <StatDescription>Teaching this subject</StatDescription>
    </Stat>
  </section>
);

const SubjectOverviewTab = ({ subject }: { readonly subject: SubjectData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Subject Profile</CardTitle>
      <CardDescription>
        Core subject information and administrative details.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      {[
        ["Name", subject.name],
        ["Status", subject.status === "ACTIVE" ? "Active" : "Archived"],
        ["Created", formatDate(subject.createdAt)],
      ].map(([label, value]) => (
        <div className="grid gap-1" key={label}>
          <span className="text-muted-foreground text-xs">{label}</span>
          <span className="font-medium text-sm">{value}</span>
        </div>
      ))}
      <div className="md:col-span-2">
        <Separator className="my-1" />
        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs">Description</span>
          <p className="text-sm">
            {subject.description ?? "No description recorded."}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SubjectClassesTab = ({ subject }: { readonly subject: SubjectData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Classes</CardTitle>
      <CardDescription>Classes that teach this subject.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
      {subject.classes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No classes teach this subject yet.
        </p>
      ) : (
        subject.classes.map((cls) => (
          <div
            className="flex flex-col gap-3 border p-4 md:flex-row md:items-center md:justify-between"
            key={cls.id}
          >
            <div className="grid gap-1">
              <Link
                className="font-medium hover:underline"
                href={`/classes/${cls.id}`}
              >
                {cls.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {dayLabel[cls.dayOfWeek]} · {formatTime(cls.startsAt)} to{" "}
                {formatTime(cls.endsAt)} ·{" "}
                {cls.teacher?.fullName ?? "No teacher"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">
                {cls.level?.name ?? "General"}
              </Badge>
              <Badge variant="outline">
                {cls.branch?.name ?? "Main branch"}
              </Badge>
              <Badge variant="outline">
                {cls.enrollments.length} / {cls.capacity ?? "-"} students
              </Badge>
              <Badge variant="outline">
                {formatMoney(cls.monthlyFeeSen)}/month
              </Badge>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

const SubjectStudentsTab = ({ subject }: { readonly subject: SubjectData }) => {
  const students = new Map<
    string,
    {
      classes: string[];
      student: SubjectData["classes"][number]["enrollments"][number]["student"];
    }
  >();

  for (const cls of subject.classes) {
    for (const enrollment of cls.enrollments) {
      const entry = students.get(enrollment.student.id) ?? {
        classes: [],
        student: enrollment.student,
      };
      entry.classes.push(cls.name);
      students.set(enrollment.student.id, entry);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>
          Students actively enrolled in this subject.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {students.size === 0 ? (
          <p className="text-muted-foreground text-sm">
            No students are enrolled in this subject yet.
          </p>
        ) : (
          [...students.values()].map(({ classes, student }) => (
            <div
              className="flex flex-col gap-3 border p-4 md:flex-row md:items-center md:justify-between"
              key={student.id}
            >
              <div className="grid gap-1">
                <Link
                  className="font-medium hover:underline"
                  href={`/students/${student.id}`}
                >
                  {student.fullName}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {classes.join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">
                  {student.level?.name ?? "General"}
                </Badge>
                <Badge variant="outline">
                  {student.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

type SubjectTeacher = NonNullable<SubjectData["classes"][number]["teacher"]>;

const SubjectTeachersTab = ({ subject }: { readonly subject: SubjectData }) => {
  const teachers = new Map<
    string,
    { classes: Array<{ id: string; name: string }>; teacher: SubjectTeacher }
  >();

  for (const cls of subject.classes) {
    if (!cls.teacher) {
      continue;
    }

    const entry = teachers.get(cls.teacher.id) ?? {
      classes: [],
      teacher: cls.teacher,
    };
    entry.classes.push({ id: cls.id, name: cls.name });
    teachers.set(cls.teacher.id, entry);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teachers</CardTitle>
        <CardDescription>
          Teachers who run classes for this subject.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {teachers.size === 0 ? (
          <p className="text-muted-foreground text-sm">
            No teachers teach this subject yet.
          </p>
        ) : (
          [...teachers.values()].map(({ classes, teacher }) => (
            <div
              className="flex flex-col gap-3 border p-4 md:flex-row md:items-center md:justify-between"
              key={teacher.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground text-xs">
                  {teacherInitials(teacher.fullName)}
                </div>
                <div className="grid gap-1">
                  <p className="font-medium">{teacher.fullName ?? "-"}</p>
                  <p className="text-muted-foreground text-sm">
                    {classes.map((cls) => cls.name).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">
                  {classes.length} class{classes.length === 1 ? "" : "es"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const SubjectSidebar = ({ subject }: { readonly subject: SubjectData }) => (
  <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Summary</CardTitle>
        <CardDescription>
          High-level subject and class information.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 border-b pb-4 text-sm">
          <div className="flex items-center gap-2">
            <UsersRoundIcon className="size-4 text-muted-foreground" />
            <span>{subject.classes.length} classes</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 text-muted-foreground" />
            <span>Created {formatDate(subject.createdAt)}</span>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center gap-2 font-medium text-sm">
            <LandmarkIcon className="size-4 text-muted-foreground" />
            Actions
          </div>
          <Button asChild variant="outline">
            <Link href={`/subjects/${subject.id}/edit`}>Edit subject</Link>
          </Button>
          <form action={archiveSubject}>
            <input name="subjectId" type="hidden" value={subject.id} />
            <Button className="w-full" variant="outline">
              Archive subject
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  </aside>
);

const SubjectProfilePage = async ({ params }: SubjectPageProperties) => {
  const tenant = await requireTenant();
  const { subjectId } = await params;
  const subject = await getSubjectData(subjectId, tenant.organizationId);

  if (!subject) {
    notFound();
  }

  const students = new Set(
    subject.classes.flatMap((cls) =>
      cls.enrollments.map((enrollment) => enrollment.studentId)
    )
  );
  const teachers = new Set(
    subject.classes
      .map((cls) => cls.teacher?.id)
      .filter((id): id is string => Boolean(id))
  );

  return (
    <>
      <Header
        page="Subject Information"
        pages={["TLAS.MY", { href: "/subjects", label: "Subjects" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Subject Information
            </h1>
            <p className="text-muted-foreground text-sm">
              View subject details, related classes, students, and teachers.
            </p>
          </div>
        </div>

        <section className="grid gap-5 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_380px]">
          <section className="grid content-start gap-5">
            <SubjectHeader subject={subject} />

            <SubjectMetrics
              classes={subject.classes.length}
              students={students.size}
              teachers={teachers.size}
            />

            <Tabs className="gap-4" defaultValue="overview">
              <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
              </TabsList>

              <TabsContent className="grid gap-5" value="overview">
                <SubjectOverviewTab subject={subject} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="classes">
                <SubjectClassesTab subject={subject} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="students">
                <SubjectStudentsTab subject={subject} />
              </TabsContent>
              <TabsContent className="grid gap-5" value="teachers">
                <SubjectTeachersTab subject={subject} />
              </TabsContent>
            </Tabs>
          </section>

          <SubjectSidebar subject={subject} />
        </section>
      </main>
    </>
  );
};

export default SubjectProfilePage;
