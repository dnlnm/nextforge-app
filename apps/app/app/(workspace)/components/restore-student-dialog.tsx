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
import { restoreStudent } from "@/app/(workspace)/students/actions";

export const RestoreStudentDialog = ({
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

  const handleRestore = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", studentId);

      try {
        await restoreStudent(formData);
        onOpenChange(false);
        toastManager.add({
          ...{
            description: "The student is active again.",
          },
          title: "Student restored",
          type: "success",
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to restore student";

        toastManager.add({
          ...{
            description: message,
          },
          title: "Could not restore student",
          type: "error",
        });
      }
    });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore student?</AlertDialogTitle>
          <AlertDialogDescription>
            This reactivates the student and restores their archived
            enrollments, making them visible again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button disabled={isPending} onClick={() => handleRestore()}>
            {isPending ? "Restoring..." : "Restore"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
