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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { DoorOpenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { archiveRoom, createRoom, restoreRoom } from "./actions";

const RoomsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const [activeRooms, archivedRooms] = await Promise.all([
    database.room.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { schedules: true } },
      },
    }),
    database.room.findMany({
      where: {
        archivedAt: { not: null },
        organizationId: tenant.organizationId,
      },
      orderBy: { archivedAt: "desc" },
    }),
  ]);

  return (
    <>
      <Header page="Rooms" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Rooms</h1>
            <p className="text-muted-foreground text-sm">
              Manage classrooms and venues used by class schedules.
            </p>
          </div>
          <Button asChild className="flex-1 md:flex-none">
            <a href="#add-room">
              <PlusIcon className="size-4" />
              Add Room
            </a>
          </Button>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr]">
          <Card id="add-room">
            <CardHeader>
              <CardTitle>Add room</CardTitle>
              <CardDescription>
                Rooms are assigned to individual class schedules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createRoom} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Room name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Room 2A, Lab 1, Online"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    min="1"
                    name="capacity"
                    placeholder="e.g. 25"
                    type="number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. Level 2, East wing"
                  />
                </div>
                <Button type="submit">Save room</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid content-start gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Active rooms</CardTitle>
                <CardDescription>
                  Rooms available for scheduling classes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Schedules</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRooms.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="h-24 text-center text-muted-foreground"
                          colSpan={6}
                        >
                          No rooms yet. Create your first room to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DoorOpenIcon className="size-4 text-muted-foreground" />
                              <span className="font-medium">{room.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{room.capacity ?? "-"}</TableCell>
                          <TableCell>{room.location ?? "-"}</TableCell>
                          <TableCell>{room._count.schedules}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/rooms/${room.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              <form action={archiveRoom}>
                                <input
                                  name="roomId"
                                  type="hidden"
                                  value={room.id}
                                />
                                <Button size="sm" variant="outline">
                                  Archive
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {archivedRooms.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Archived rooms</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">
                            {room.name}
                          </TableCell>
                          <TableCell>{room.capacity ?? "-"}</TableCell>
                          <TableCell>{room.location ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <form action={restoreRoom}>
                                <input
                                  name="roomId"
                                  type="hidden"
                                  value={room.id}
                                />
                                <Button size="sm" variant="outline">
                                  Restore
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
};

export default RoomsPage;
