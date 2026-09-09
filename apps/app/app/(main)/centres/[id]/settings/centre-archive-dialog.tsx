"use client";

import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/fluid-dialog";
import {
  InputField,
  InputGroup,
} from "@repo/design-system/components/ui/fluid-input-group";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { archiveCentre } from "./actions";

interface CentreArchiveDialogProps {
  readonly centreName: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly organizationId: string;
}

export const CentreArchiveDialog = ({
  centreName,
  onOpenChange,
  open,
  organizationId,
}: CentreArchiveDialogProps) => {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [archiving, setArchiving] = useState(false);

  const matches = confirmation.trim() === centreName.trim();

  const handleArchive = async () => {
    if (!matches || archiving) {
      return;
    }

    setArchiving(true);

    try {
      await archiveCentre(organizationId, confirmation);
      toastManager.add({ title: "Centre archived", type: "success" });
      onOpenChange(false);
      router.push("/centres");
      router.refresh();
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error ? error.message : "Failed to archive centre",
        type: "error",
      });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Archive {centreName}?</DialogTitle>
          <DialogDescription>
            This locks the centre workspace for all staff. Historical attendance
            and invoice records stay preserved for PDPA and tax compliance.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
          <li>Staff and teachers lose access immediately.</li>
          <li>Cancel any active Stripe subscription first.</li>
          <li>Type the exact centre name below to confirm.</li>
        </ul>

        <InputGroup>
          <InputField
            index={0}
            label="Centre name"
            onChange={setConfirmation}
            placeholder={centreName}
            value={confirmation}
          />
        </InputGroup>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="tertiary"
          >
            Cancel
          </Button>
          <Button
            disabled={!matches || archiving}
            onClick={handleArchive}
            type="button"
            variant="ghost"
          >
            {archiving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-destructive">Archiving...</span>
              </>
            ) : (
              <span className="text-destructive">Archive Centre</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
