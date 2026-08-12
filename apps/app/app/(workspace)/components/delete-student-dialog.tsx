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
import { deleteStudent } from "@/app/(workspace)/students/actions";

export const DeleteStudentDialog = ({
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

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", studentId);

      try {
        await deleteStudent(formData);
        onOpenChange(false);
        toastManager.add({
          ...{
            description: "The student record has been removed.",
          },
          title: "Student deleted",
          type: "success",
        });
        router.push("/students");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete student";

        toastManager.add({
          ...{
            description: message,
          },
          title: "Could not delete student",
          type: "error",
        });
      }
    });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete student?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the student and their enrollments,
            attendance, and guardian links. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button
            disabled={isPending}
            onClick={() => handleDelete()}
            variant="destructive"
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
