import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Header } from "../components/header";
import { ScheduleCalendar } from "./schedule-calendar";

const SchedulesPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [classes, rooms, teachers, levels, subjects] = await Promise.all([
    database.learningClass.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
        schedules: { some: {} },
      },
      include: {
        level: { select: { name: true } },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
          include: { room: { select: { name: true } } },
        },
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: { name: "asc" },
    }),
    database.room.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    database.teacherProfile.findMany({
      where: { archivedAt: null, organizationId: tenant.organizationId },
      orderBy: { fullName: "asc" },
      select: { fullName: true, id: true },
    }),
    database.level.findMany({
      where: { archivedAt: null, organizationId: tenant.organizationId },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    database.subject.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const scheduleBlocks = classes.flatMap((learningClass) =>
    learningClass.schedules.map((schedule) => ({
      classId: learningClass.id,
      className: learningClass.name,
      code: learningClass.code,
      dayOfWeek: schedule.dayOfWeek,
      endsAt: schedule.endsAt,
      levelId: learningClass.levelId ?? null,
      levelName: learningClass.level?.name ?? null,
      roomId: schedule.roomId ?? null,
      roomName: schedule.room?.name ?? null,
      startsAt: schedule.startsAt,
      subjectId: learningClass.subjectId,
      subjectName: learningClass.subject.name,
      teacherId: learningClass.teacherId ?? null,
      teacherName: learningClass.teacher?.fullName ?? null,
    }))
  );

  return (
    <>
      <Header page="Schedules" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Schedules</h1>
          <p className="text-muted-foreground text-sm">
            Weekly class timetable grouped by teacher, room, or class.
          </p>
        </div>

        <ScheduleCalendar
          blocks={scheduleBlocks}
          filters={{
            classes: classes.map((learningClass) => ({
              id: learningClass.id,
              name: learningClass.name,
            })),
            levels: levels.map((level) => ({ id: level.id, name: level.name })),
            rooms: rooms.map((room) => ({ id: room.id, name: room.name })),
            subjects: subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
            })),
            teachers: teachers.map((teacher) => ({
              id: teacher.id,
              name: teacher.fullName,
            })),
          }}
        />
      </main>
    </>
  );
};

export default SchedulesPage;
