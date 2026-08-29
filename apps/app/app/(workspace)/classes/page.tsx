import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import {
  KpiToggleButton,
  KpiVisibilityProvider,
} from "../components/kpi-visibility";
import { ClassesPageClient } from "./classes-page-client";

const ClassesPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classes = await database.learningClass.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { name: "asc" },
    include: {
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

  return (
    <KpiVisibilityProvider>
      <Header page="Classes" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Classes</h1>
            <p className="text-muted-foreground text-sm">
              Manage tuition classes, schedules and teachers.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              className="min-w-0 flex-1 md:flex-none"
              render={<Link href="/classes/new" />}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Add New Class</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <KpiToggleButton />
          </div>
        </div>

        <ClassesPageClient
          activeClasses={activeClasses.length}
          averageClassSize={averageClassSize}
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
          totalClasses={classes.length}
          totalEnrollments={totalEnrollments}
        />
      </main>
    </KpiVisibilityProvider>
  );
};

export default ClassesPage;
