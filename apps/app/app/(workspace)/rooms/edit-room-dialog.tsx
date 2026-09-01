"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { useEffect, useState } from "react";
import { updateRoom } from "./actions";

export interface EditRoomData { readonly id: string; readonly name: string; readonly capacity: number | null; readonly location: string | null }

export const EditRoomDialog = ({ room, open, onOpenChange }: { readonly room: EditRoomData | null; readonly open: boolean; readonly onOpenChange: (v: boolean) => void }) => {
  const [name, setName] = useState(room?.name ?? "");
  useEffect(() => { if (room) setName(room.name); }, [room]);
  if (!room) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit room</DialogTitle><DialogDescription>Update details for {room.name}.</DialogDescription></DialogHeader>
        <form
          action={async (fd) => {
            try { await updateRoom(fd); toastManager.add({ title: "Room updated", type: "success" }); onOpenChange(false); } catch (e) { toastManager.add({ title: e instanceof Error ? e.message : "Error", type: "error" }); }
          }}
          className="grid gap-4"
        >
          <input name="roomId" type="hidden" value={room.id} />
          <div className="grid gap-2"><Label htmlFor="edit-name">Room name</Label><Input id="edit-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid gap-2"><Label htmlFor="edit-capacity">Capacity</Label><Input id="edit-capacity" name="capacity" defaultValue={room.capacity ?? ""} type="number" min="1" /></div>
          <div className="grid gap-2"><Label htmlFor="edit-location">Location</Label><Input id="edit-location" name="location" defaultValue={room.location ?? ""} /></div>
          <DialogFooter><Button type="submit">Save changes</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
