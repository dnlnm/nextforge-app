"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/fluid-dialog";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { archiveStudent } from "@/app/(workspace)/students/actions";

export const ArchiveStudentDialog = ({
  onOpenChange,
  open,
  studentId,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  studentId: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleArchive = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", studentId);

      try {
        await archiveStudent(formData);
        onOpenChange(false);
        toastManager.add({
          ...{
            description: "The student and their enrollments were archived.",
          },
          title: "Student archived",
          type: "success",
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to archive student";

        toastManager.add({
          ...{
            description: message,
          },
          title: "Could not archive student",
          type: "error",
        });
      }
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive student?</DialogTitle>
          <DialogDescription>
            This hides the student and ends their active enrollments while
            keeping their record and billing history intact.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            Cancel
          </DialogClose>
          <Button
            loading={isPending}
            onClick={() => handleArchive()}
          >
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
