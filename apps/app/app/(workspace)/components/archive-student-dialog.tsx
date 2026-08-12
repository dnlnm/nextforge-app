"use client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
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
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive student?</AlertDialogTitle>
          <AlertDialogDescription>
            This hides the student and ends their active enrollments while
            keeping their record and billing history intact.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button disabled={isPending} onClick={() => handleArchive()}>
            {isPending ? "Archiving..." : "Archive"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
