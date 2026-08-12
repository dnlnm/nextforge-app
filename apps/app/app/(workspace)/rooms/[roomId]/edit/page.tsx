import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { updateRoom } from "../../actions";

interface EditRoomPageProperties {
  readonly params: Promise<{ roomId: string }>;
}

const EditRoomPage = async ({ params }: EditRoomPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { roomId } = await params;

  const room = await database.room.findFirst({
    where: { id: roomId, organizationId: tenant.organizationId },
  });

  if (!room) {
    notFound();
  }

  return (
    <>
      <Header
        page="Edit Room"
        pages={[`${appName}`, { href: "/rooms", label: "Rooms" }]}
      />
      <main className="mx-auto grid w-full max-w-lg gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Edit room</h1>
          <p className="text-muted-foreground text-sm">
            Update the details for {room.name}.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Room details</CardTitle>
            <CardDescription>
              Capacity is used to warn when a class exceeds the room limit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRoom} className="grid gap-4">
              <input name="roomId" type="hidden" value={room.id} />
              <div className="grid gap-2">
                <Label htmlFor="name">Room name</Label>
                <Input
                  defaultValue={room.name}
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  defaultValue={room.capacity ?? ""}
                  id="capacity"
                  min="1"
                  name="capacity"
                  type="number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  defaultValue={room.location ?? ""}
                  id="location"
                  name="location"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button variant="outline" render={<Link href="/rooms" />}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default EditRoomPage;
