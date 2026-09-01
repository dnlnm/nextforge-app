"use client";

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { restoreRoom } from "./actions";

export const RestoreRoomDialog = ({ room, open, onOpenChange }: { readonly room: { readonly id: string; readonly name: string } | null; readonly open: boolean; readonly onOpenChange: (v: boolean) => void }) => {
  if (!room) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Restore {room.name}?</AlertDialogTitle><AlertDialogDescription>This will make the room active again.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => { const fd = new FormData(); fd.set("roomId", room.id); try { await restoreRoom(fd); toastManager.add({ title: "Room restored", type: "success" }); onOpenChange(false); } catch (e) { toastManager.add({ title: e instanceof Error ? e.message : "Error", type: "error" }); }}}>Restore</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
