"use client";

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { archiveRoom } from "./actions";

export const ArchiveRoomDialog = ({ room, open, onOpenChange }: { readonly room: { readonly id: string; readonly name: string; readonly schedules: number } | null; readonly open: boolean; readonly onOpenChange: (v: boolean) => void }) => {
  if (!room) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Archive {room.name}?</AlertDialogTitle><AlertDialogDescription>{room.schedules ? `This room has ${room.schedules} active schedule(s). Remove them first.` : "You can restore it later from Archived."}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={async () => {
              const fd = new FormData(); fd.set("roomId", room.id);
              try { await archiveRoom(fd); toastManager.add({ title: "Room archived", type: "success" }); onOpenChange(false); } catch (e) { toastManager.add({ title: e instanceof Error ? e.message : "Error", type: "error" }); }
            }}
          >
            Archive
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
