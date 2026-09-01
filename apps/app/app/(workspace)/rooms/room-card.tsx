"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@repo/design-system/components/ui/menu";
import { DoorOpenIcon, MoreHorizontalIcon, PencilIcon, ArchiveIcon, EyeIcon } from "lucide-react";

export interface RoomCardItem {
  readonly id: string;
  readonly name: string;
  readonly capacity: number | null;
  readonly location: string | null;
  readonly schedules: readonly { readonly class: { readonly name: string; readonly enrollments: number; readonly capacity: number | null } }[];
  readonly overflow: boolean;
}

export const RoomCard = ({ room, onView, onEdit, onArchive }: { readonly room: RoomCardItem; readonly onView: () => void; readonly onEdit: () => void; readonly onArchive: () => void }) => (
  <Card className="flex flex-col">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <DoorOpenIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">{room.name}</CardTitle>
        </div>
        <Menu>
          <MenuTrigger render={<Button size="icon-xs" variant="ghost" />}>
            <MoreHorizontalIcon className="size-4" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem onClick={onView}><EyeIcon />View schedule</MenuItem>
            <MenuItem onClick={onEdit}><PencilIcon />Edit</MenuItem>
            <MenuItem onClick={onArchive} variant="destructive"><ArchiveIcon />Archive</MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </CardHeader>
    <CardContent className="grid gap-2 pt-0 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant={room.overflow ? "warning" : "secondary"}>{room.capacity ? `${room.capacity} seats` : "No capacity"}</Badge>
        {room.location ? <Badge variant="outline">{room.location}</Badge> : null}
        {room.overflow ? <Badge variant="warning">Overflow</Badge> : null}
      </div>
      <p className="text-muted-foreground text-xs">{room.schedules.length} schedule(s) · {room.schedules.map((s) => s.class.name).slice(0, 3).join(", ") || "No classes"}</p>
    </CardContent>
  </Card>
);
