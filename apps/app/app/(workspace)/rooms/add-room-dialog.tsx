"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { createRoom } from "./actions";

export const AddRoomDialog = ({ open, onOpenChange }: { readonly open: boolean; readonly onOpenChange: (v: boolean) => void }) => {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon className="size-4" />Add Room
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add room</DialogTitle><DialogDescription>Rooms are assigned to class schedules.</DialogDescription></DialogHeader>
        <form
          action={async (fd) => {
            try { await createRoom(fd); toastManager.add({ title: "Room created", type: "success" }); setName(""); onOpenChange(false); } catch (e) { toastManager.add({ title: e instanceof Error ? e.message : "Error", type: "error" }); }
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2"><Label htmlFor="name">Room name</Label><Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Room 2A" required /></div>
          <div className="grid gap-2"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" name="capacity" type="number" min="1" placeholder="e.g. 25" /></div>
          <div className="grid gap-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" placeholder="e.g. Level 2" /></div>
          <DialogFooter><Button type="submit"><PlusIcon className="size-4" />Save room</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
