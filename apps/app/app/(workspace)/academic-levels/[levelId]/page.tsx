import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
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
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { getLevelDashboard } from "@repo/domain/levels/dashboard";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Balancer from "react-wrap-balancer";
import { Header } from "../../components/header";

interface LevelPageProperties {
  readonly params: Promise<{ levelId: string }>;
}

const LevelPage = async ({ params }: LevelPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { levelId } = await params;

  const [level, dashboard] = await Promise.all([
    database.level.findFirst({
      where: {
        archivedAt: null,
        id: levelId,
        organizationId: tenant.organizationId,
      },
      include: {
        classes: {
          where: { archivedAt: null, status: "ACTIVE" },
          include: {
            subject: { select: { id: true, name: true } },
            teacher: { select: { fullName: true, id: true } },
            _count: {
              select: {
                enrollments: { where: { archivedAt: null, status: "ACTIVE" } },
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
    getLevelDashboard(database, {
      levelId,
      organizationId: tenant.organizationId,
    }),
  ]);

  if (!level) {
    notFound();
  }

  const classesBySubject = new Map<
    string,
    { readonly name: string; readonly classes: typeof level.classes }
  >();

  for (const learningClass of level.classes) {
    const current = classesBySubject.get(learningClass.subject.id) ?? {
      classes: [],
      name: learningClass.subject.name,
    };
    current.classes.push(learningClass);
    classesBySubject.set(learningClass.subject.id, current);
  }

  return (
    <>
      <Header
        page="Academic Level"
        pages={[
          `${appName}`,
          { href: "/academic-levels", label: "Academic Levels" },
        ]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <Card>
          <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                <BookOpenIcon className="size-10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
                    <Balancer>{level.name}</Balancer>
                  </h1>
                  <Badge variant="outline">{level.code}</Badge>
                  <Badge variant="secondary">{level.stage}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">
                  Overview of students, classes, subjects, and teachers at this
                  level. Subjects and teachers are derived from active classes.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/academic-levels">Back to levels</Link>
            </Button>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat>
            <StatLabel>Students</StatLabel>
            <StatIndicator color="info" variant="icon">
              <UsersRoundIcon />
            </StatIndicator>
            <StatValue>{dashboard?.studentCount ?? 0}</StatValue>
            <StatDescription>Assigned to this level</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Classes</StatLabel>
            <StatIndicator color="success" variant="icon">
              <CalendarDaysIcon />
            </StatIndicator>
            <StatValue>{dashboard?.activeClassCount ?? 0}</StatValue>
            <StatDescription>Active classes</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Subjects</StatLabel>
            <StatIndicator color="warning" variant="icon">
              <BookOpenIcon />
            </StatIndicator>
            <StatValue>{dashboard?.distinctSubjectCount ?? 0}</StatValue>
            <StatDescription>Distinct subjects</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Teachers</StatLabel>
            <StatIndicator color="default" variant="icon">
              <UserRoundIcon />
            </StatIndicator>
            <StatValue>{dashboard?.distinctTeacherCount ?? 0}</StatValue>
            <StatDescription>Distinct teachers</StatDescription>
          </Stat>
        </section>

        <section className="grid gap-5">
          {classesBySubject.size === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No active classes at this level yet. Classes appear here once
                they are created with this level assigned.
              </CardContent>
            </Card>
          ) : (
            Array.from(classesBySubject.entries()).map(([subjectId, group]) => (
              <Card key={subjectId}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>{group.name}</CardTitle>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/subjects/${subjectId}`}>View subject</Link>
                    </Button>
                  </div>
                  <CardDescription>
                    {group.classes.length} class
                    {group.classes.length === 1 ? "" : "es"} at this level.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {group.classes.map((learningClass) => (
                    <Link
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                      href={`/classes/${learningClass.id}`}
                      key={learningClass.id}
                    >
                      <span className="font-medium">{learningClass.name}</span>
                      <span className="text-muted-foreground">
                        {learningClass._count.enrollments} students ·{" "}
                        {learningClass.teacher?.fullName ?? "Unassigned"}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </>
  );
};

export default LevelPage;
