"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@repo/design-system/components/ui/sheet";
import { formatWallClockTime } from "@repo/date";
import Link from "next/link";

const dayOrder = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;

export interface RoomDetailRoom {
  readonly id: string;
  readonly name: string;
  readonly capacity: number | null;
  readonly location: string | null;
  readonly schedules: readonly {
    readonly dayOfWeek: string;
    readonly startsAt: string;
    readonly endsAt: string;
    readonly class: { readonly id: string; readonly name: string; readonly code: string; readonly enrollments: number };
  }[];
}

export const RoomDetailSheet = ({ room, open, onOpenChange, onEdit }: { readonly room: RoomDetailRoom | null; readonly open: boolean; readonly onOpenChange: (v: boolean) => void; readonly onEdit: () => void }) => {
  if (!room) return null;
  const grouped = dayOrder.map((day) => ({ day, items: room.schedules.filter((s) => s.dayOfWeek === day) }));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{room.name}</SheetTitle>
          <SheetDescription>
            Capacity {room.capacity ?? "—"} {room.location ? `· ${room.location}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={onEdit}>Edit room</Button>
            <Button size="sm" variant="outline" render={<Link href="/rooms" />}>Close</Button>
          </div>
          <div className="grid gap-3">
            {grouped.map(({ day, items }) => (
              <div key={day} className="rounded-lg border p-3">
                <p className="font-medium text-xs uppercase tracking-wide">{day}</p>
                {items.length === 0 ? <p className="text-muted-foreground text-xs">No classes</p> : items.map((s) => (
                  <div key={`${s.dayOfWeek}-${s.startsAt}`} className="flex items-center justify-between gap-2 py-1 text-sm">
                    <Link href={`/classes/${s.class.id}`} className="font-medium hover:underline">{s.class.name}</Link>
                    <Badge variant={room.capacity && s.class.enrollments > room.capacity ? "warning" : "secondary"}>
                      {formatWallClockTime(s.startsAt)}-{formatWallClockTime(s.endsAt)} · {s.class.enrollments} students
                    </Badge>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
