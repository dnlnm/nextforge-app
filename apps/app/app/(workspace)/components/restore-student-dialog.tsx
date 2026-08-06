"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
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
        toast.success("Student restored", {
          description: "The student is active again.",
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to restore student";

        toast.error("Could not restore student", {
          description: message,
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
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleRestore();
            }}
          >
            {isPending ? "Restoring..." : "Restore"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
