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
import { archiveStudent } from "@/app/(authenticated)/students/actions";

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
        toast.success("Student archived", {
          description: "The student and their enrollments were archived.",
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to archive student";

        toast.error("Could not archive student", {
          description: message,
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
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleArchive();
            }}
          >
            {isPending ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
