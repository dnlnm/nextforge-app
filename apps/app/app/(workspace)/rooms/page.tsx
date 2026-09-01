import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Header } from "../components/header";
import { RoomsPageClient } from "./rooms-page-client";

const RoomsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const [activeRooms, archivedRooms] = await Promise.all([
    database.room.findMany({
      where: { archivedAt: null, organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: {
        schedules: {
          select: {
            dayOfWeek: true,
            startsAt: true,
            endsAt: true,
            class: { select: { id: true, name: true, code: true, _count: { select: { enrollments: { where: { status: "ACTIVE", archivedAt: null } } } } } },
          },
        },
      },
    }),
    database.room.findMany({
      where: { archivedAt: { not: null }, organizationId: tenant.organizationId },
      orderBy: { archivedAt: "desc" },
      include: {
        schedules: {
          select: {
            dayOfWeek: true,
            startsAt: true,
            endsAt: true,
            class: { select: { id: true, name: true, code: true, _count: { select: { enrollments: { where: { status: "ACTIVE", archivedAt: null } } } } } },
          },
        },
      },
    }),
  ]);

  const mapRoom = (r: typeof activeRooms[number]) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    location: r.location,
    status: r.status,
    schedules: r.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startsAt: s.startsAt, endsAt: s.endsAt, class: { id: s.class.id, name: s.class.name, code: s.class.code, enrollments: s.class._count.enrollments } })),
  });

  return (
    <>
      <Header page="Rooms" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Rooms</h1>
          <p className="text-muted-foreground text-sm">Manage classrooms and venues used by class schedules.</p>
        </div>
        <RoomsPageClient activeRooms={activeRooms.map(mapRoom)} archivedRooms={archivedRooms.map(mapRoom)} />
      </main>
    </>
  );
};

export default RoomsPage;
