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
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete student?</DialogTitle>
          <DialogDescription>
            This permanently removes the student and their enrollments,
            attendance, and guardian links. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            Cancel
          </DialogClose>
          <Button loading={isPending} onClick={() => handleDelete()}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
