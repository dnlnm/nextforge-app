"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { privateFileUrl } from "@repo/storage/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArchiveIcon,
  EyeIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ArchiveStudentDialog } from "../components/archive-student-dialog";
import { DeleteStudentDialog } from "../components/delete-student-dialog";
import { RestoreStudentDialog } from "../components/restore-student-dialog";
import { StudentAvatar } from "../components/student-avatar";
import { StudentStatusBadge } from "../components/student-status-badge";

export type Student = {
  id: string;
  fullName: string;
  status: string;
  code: string;
  gender: string | null;
  photoKey: string | null;
  level: {
    name: string;
  } | null;
  guardians: Array<{
    guardian: {
      phone: string | null;
    };
  }>;
};

export const StudentRowActions = ({ student }: { student: Student }) => {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const isArchived = student.status === "ARCHIVED";
  const guardian = student.guardians[0]?.guardian;

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label="Row actions" size="icon" variant="ghost" />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/students/${student.id}`} />}>
            <EyeIcon />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <Link
                href={guardian?.phone ? `https://wa.me/${guardian.phone}` : "#"}
              />
            }
          >
            <MessageCircleIcon />
            WhatsApp
          </DropdownMenuItem>
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
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ArchiveStudentDialog
        onOpenChange={setIsArchiveOpen}
        open={isArchiveOpen}
        studentId={student.id}
      />
      <RestoreStudentDialog
        onOpenChange={setIsRestoreOpen}
        open={isRestoreOpen}
        studentId={student.id}
      />
      <DeleteStudentDialog
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
        studentId={student.id}
      />
    </div>
  );
};

/**
 * Column set for the students table. Sorting is server-side; only the columns
 * the server can order by (`fullName`, `academicLevel`, `status`) are sortable.
 */
export const getStudentColumns = (): ColumnDef<Student>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    size: 28,
  },
  {
    accessorKey: "fullName",
    size: 280,
    header: "Student",
    cell: ({ row }) => {
      return (
        <div className="flex max-w-full items-center gap-3">
          <StudentAvatar
            className="size-10"
            gender={row.original.gender}
            name={row.original.fullName}
            photoUrl={privateFileUrl(row.original.photoKey)}
          />
          <div className="min-w-0 flex-1">
            <Link
              className="block truncate font-medium hover:underline"
              href={`/students/${row.original.id}`}
            >
              {row.original.fullName}
            </Link>
            <span className="block truncate text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "academicLevel",
    size: 160,
    header: "Level/Year",
    cell: ({ row }) => row.original.level?.name ?? "-",
  },
  {
    accessorKey: "status",
    size: 140,
    header: "Status",
    cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "gender",
    size: 120,
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.original.gender;
      return gender
        ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
        : "-";
    },
    enableSorting: false,
  },
  {
    id: "actions",
    size: 80,
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <StudentRowActions student={row.original} />,
    enableSorting: false,
  },
];
