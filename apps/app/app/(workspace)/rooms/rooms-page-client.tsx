"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/design-system/components/ui/table";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@repo/design-system/components/ui/tabs";
import { DoorOpenIcon, SearchIcon, LayoutGridIcon, TableIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AddRoomDialog } from "./add-room-dialog";
import { ArchiveRoomDialog } from "./archive-room-dialog";
import { EditRoomDialog } from "./edit-room-dialog";
import { RestoreRoomDialog } from "./restore-room-dialog";
import { RoomCard } from "./room-card";
import { RoomDetailSheet } from "./room-detail-sheet";
import { RoomStats } from "./room-stats";

type Room = {
  readonly id: string;
  readonly name: string;
  readonly capacity: number | null;
  readonly location: string | null;
  readonly status: string;
  readonly schedules: readonly { readonly dayOfWeek: string; readonly startsAt: string; readonly endsAt: string; readonly class: { readonly id: string; readonly name: string; readonly code: string; readonly enrollments: number } }[];
};

const capacityBucket = (c: number | null) => {
  if (c == null) return "unknown";
  if (c <= 15) return "small";
  if (c <= 30) return "medium";
  return "large";
};

export const RoomsPageClient = ({ activeRooms, archivedRooms }: { readonly activeRooms: readonly Room[]; readonly archivedRooms: readonly Room[] }) => {
  const [tab, setTab] = useState("active");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [archiveRoom, setArchiveRoom] = useState<Room | null>(null);
  const [restoreRoom, setRestoreRoom] = useState<Room | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  const rooms = tab === "active" ? activeRooms : archivedRooms;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (q && !(`${r.name} ${r.location ?? ""}`.toLowerCase().includes(q))) return false;
      if (bucket !== "all" && capacityBucket(r.capacity) !== bucket) return false;
      return true;
    });
  }, [rooms, search, bucket]);

  // stats from active only
  const totalSeats = useMemo(() => activeRooms.reduce((s, r) => s + (r.capacity ?? 0), 0), [activeRooms]);
  const weeklyHours = useMemo(() => {
    let mins = 0;
    for (const r of activeRooms) for (const s of r.schedules) {
      const [sh, sm] = s.startsAt.split(":").map(Number);
      const [eh, em] = s.endsAt.split(":").map(Number);
      mins += eh * 60 + em - (sh * 60 + sm);
    }
    return Math.round(mins / 60);
  }, [activeRooms]);
  const overflowCount = useMemo(() => activeRooms.filter((r) => r.schedules.some((s) => r.capacity != null && s.class.enrollments > r.capacity!)).length, [activeRooms]);

  return (
    <div className="grid gap-5">
      <RoomStats totalRooms={activeRooms.length} totalSeats={totalSeats} weeklyHours={weeklyHours} overflowCount={overflowCount} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
          <option value="all">All capacities</option>
          <option value="small">Small ≤15</option>
          <option value="medium">Medium 16-30</option>
          <option value="large">Large &gt;30</option>
        </select>
        <div className="ml-auto flex gap-1 rounded-lg border p-1">
          <Button size="sm" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")}><LayoutGridIcon className="size-4" /></Button>
          <Button size="sm" variant={view === "table" ? "secondary" : "ghost"} onClick={() => setView("table")}><TableIcon className="size-4" /></Button>
        </div>
        <AddRoomDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="underline">
          <TabsTab value="active">Active ({activeRooms.length})</TabsTab>
          <TabsTab value="archived">Archived ({archivedRooms.length})</TabsTab>
        </TabsList>

        <TabsPanel value="active" className="grid gap-4 pt-4">
          {filtered.length === 0 ? (
            <Empty><EmptyHeader><EmptyTitle>No rooms found</EmptyTitle><EmptyDescription>Try different search or create a room.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => setAddOpen(true)}>Add room</Button></EmptyContent></Empty>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <RoomCard
                  key={r.id}
                  room={{ id: r.id, name: r.name, capacity: r.capacity, location: r.location, schedules: r.schedules as any, overflow: r.capacity != null && r.schedules.some((s) => s.class.enrollments > r.capacity!) }}
                  onView={() => setDetailRoom(r)}
                  onEdit={() => setEditRoom(r)}
                  onArchive={() => setArchiveRoom(r)}
                />
              ))}
            </div>
          ) : (
            <PreviewCard stageClassName="flex-col items-stretch p-0 sm:p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Room</TableHead><TableHead>Capacity</TableHead><TableHead>Location</TableHead><TableHead>Schedules</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className="border-border last:border-0">
                        <TableCell><div className="flex items-center gap-2"><DoorOpenIcon className="size-4 text-muted-foreground" />{r.name}</div></TableCell>
                        <TableCell>{r.capacity ?? "—"} {r.capacity && filtered.some(() => false) ? null : null}{r.capacity && r.schedules.some((s) => s.class.enrollments > r.capacity!) ? <Badge variant="warning" className="ml-2">Overflow</Badge> : null}</TableCell>
                        <TableCell>{r.location ?? "—"}</TableCell>
                        <TableCell>{r.schedules.length}</TableCell>
                        <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setDetailRoom(r)}>View</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="bg-border/60" />
              </div>
            </PreviewCard>
          )}
        </TabsPanel>

        <TabsPanel value="archived" className="grid gap-4 pt-4">
          {filtered.length === 0 ? <Empty><EmptyHeader><EmptyTitle>No archived rooms</EmptyTitle></EmptyHeader></Empty> :
            view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => (
                  <RoomCard key={r.id} room={{ id: r.id, name: r.name, capacity: r.capacity, location: r.location, schedules: [], overflow: false }} onView={() => setDetailRoom(r)} onEdit={() => setEditRoom(r)} onArchive={() => setRestoreRoom(r)} />
                ))}
              </div>
            ) : (
              <PreviewCard stageClassName="flex-col p-0 sm:p-0 overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="border-border"><TableHead>Room</TableHead><TableHead>Capacity</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className="border-border"><TableCell>{r.name}</TableCell><TableCell>{r.capacity ?? "—"}</TableCell><TableCell>{r.location ?? "—"}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setRestoreRoom(r)}>Restore</Button></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </PreviewCard>
            )}
        </TabsPanel>
      </Tabs>

      <EditRoomDialog room={editRoom as any} open={!!editRoom} onOpenChange={(v) => !v && setEditRoom(null)} />
      <ArchiveRoomDialog room={archiveRoom ? { id: archiveRoom.id, name: archiveRoom.name, schedules: archiveRoom.schedules.length } : null} open={!!archiveRoom} onOpenChange={(v) => !v && setArchiveRoom(null)} />
      <RestoreRoomDialog room={restoreRoom ? { id: restoreRoom.id, name: restoreRoom.name } : null} open={!!restoreRoom} onOpenChange={(v) => !v && setRestoreRoom(null)} />
      <RoomDetailSheet room={detailRoom as any} open={!!detailRoom} onOpenChange={(v) => !v && setDetailRoom(null)} onEdit={() => { if (detailRoom) { setEditRoom(detailRoom); setDetailRoom(null); } }} />
    </div>
  );
};
