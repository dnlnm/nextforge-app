"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  Edit3Icon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
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
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreHorizontalIcon className="size-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/students/${studentId}/edit`}>
              <Edit3Icon />
              Edit profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setIsRestoreOpen(true);
              }}
            >
              <RotateCcwIcon />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                setIsArchiveOpen(true);
              }}
            >
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              setIsDeleteOpen(true);
            }}
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
