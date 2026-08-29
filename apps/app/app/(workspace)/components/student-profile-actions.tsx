"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
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
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>
          <MoreHorizontalIcon className="size-4" />
          More
        </MenuTrigger>
        <MenuContent align="end" className="w-44">
          {isArchived ? (
            <MenuItem onClick={() => setIsRestoreOpen(true)}>
              <RotateCcwIcon />
              Restore
            </MenuItem>
          ) : (
            <MenuItem variant="destructive" onClick={() => setIsArchiveOpen(true)}>
              <ArchiveIcon />
              Archive
            </MenuItem>
          )}
          <MenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2Icon />
            Delete student
          </MenuItem>
        </MenuContent>
      </Menu>
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
