"use client";

import { DataTableColumnHeader } from "@repo/design-system/components/niko-table/components/data-table-column-header";
import { DataTableColumnTitle } from "@repo/design-system/components/niko-table/components/data-table-column-title";
import type { DataTableColumnDef } from "@repo/design-system/components/niko-table/types";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  Edit3Icon,
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

export type Student = {
  id: string;
  fullName: string;
  status: string;
  code: string;
  gender: string | null;
  photoUrl: string | null;
  level: {
    name: string;
  } | null;
  class?: never;
  tutor?: never;
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
        <DropdownMenuTrigger asChild>
          <Button aria-label="Row actions" size="icon" variant="ghost">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/students/${student.id}`}>
              <EyeIcon />
              View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/students/${student.id}/edit`}>
              <Edit3Icon />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={guardian?.phone ? `https://wa.me/${guardian.phone}` : "#"}
            >
              <MessageCircleIcon />
              WhatsApp
            </Link>
          </DropdownMenuItem>
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

export const columns: DataTableColumnDef<Student>[] = [
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
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    size: 280,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex max-w-full items-center gap-3">
          <StudentAvatar
            className="size-10"
            gender={row.original.gender}
            name={row.original.fullName}
            photoUrl={row.original.photoUrl}
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
    meta: {
      label: "Student",
    },
    enableHiding: false,
  },
  {
    accessorKey: "academicLevel",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => row.original.level?.name ?? "-",
    meta: {
      label: "Level/Year",
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.status === "ACTIVE" ? "Active" : "Archived"}
      </Badge>
    ),
    meta: {
      label: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Archived", value: "ARCHIVED" },
      ],
      variant: "select",
    },
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <StudentRowActions student={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
