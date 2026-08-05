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
import { deleteStudent } from "@/app/(authenticated)/students/actions";

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
        toast.success("Student deleted", {
          description: "The student record has been removed.",
        });
        router.push("/students");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete student";

        toast.error("Could not delete student", {
          description: message,
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
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
