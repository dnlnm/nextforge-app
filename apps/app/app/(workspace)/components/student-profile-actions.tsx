"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { ArchiveStudentDialog } from "./archive-student-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";
import { RestoreStudentDialog } from "./restore-student-dialog";

export const StudentProfileActions = ({
  status,
  studentId,
}: {
  status: string;
  studentId: string;
}) => {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const isArchived = status === "ARCHIVED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          <MoreHorizontalIcon className="size-4" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {isArchived ? (
            <DropdownMenuItem onClick={() => setIsRestoreOpen(true)}>
              <RotateCcwIcon />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setIsArchiveOpen(true)}
            >
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete student
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ArchiveStudentDialog
        onOpenChange={setIsArchiveOpen}
        open={isArchiveOpen}
        studentId={studentId}
      />
      <RestoreStudentDialog
        onOpenChange={setIsRestoreOpen}
        open={isRestoreOpen}
        studentId={studentId}
      />
      <DeleteStudentDialog
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
        studentId={studentId}
      />
    </>
  );
};
