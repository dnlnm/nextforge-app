"use client";

import { Button } from "@repo/design-system/components/ui/fluid-button";
import { VanillaCheckbox as Checkbox } from "@repo/design-system/components/ui/checkbox-vanilla";
import { DataTableSortableHeader } from "@repo/design-system/components/ui/data-table/data-table-column-header";
import {
  type ColumnMeta,
  createAppColumnHelper,
} from "@repo/design-system/components/ui/data-table/table";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@repo/design-system/components/ui/fluid-dropdown";
import { MenuItem } from "@repo/design-system/components/ui/fluid-menu-item";
import { privateFileUrl } from "@repo/storage/client";
import {
  ArchiveIcon,
  EyeIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export interface FilterOption {
  label: string;
  value: string;
}

export const StudentRowActions = ({ student }: { student: Student }) => {
  const router = useRouter();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const isArchived = student.status === "ARCHIVED";
  const guardian = student.guardians[0]?.guardian;

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu size="compact">
        <DropdownTrigger
          render={
            <Button aria-label="Row actions" size="icon-compact" variant="ghost" />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownTrigger>
        <DropdownContent align="end" className="w-44">
          <MenuItem
            icon={EyeIcon}
            index={0}
            label="View profile"
            onSelect={() => router.push(`/students/${student.id}`)}
          />
          <MenuItem
            icon={MessageCircleIcon}
            index={1}
            label="WhatsApp"
            onSelect={() => {
              window.location.href = guardian?.phone
                ? `https://wa.me/${guardian.phone}`
                : "#";
            }}
          />
          {isArchived ? (
            <MenuItem
              icon={RotateCcwIcon}
              index={2}
              label="Restore"
              onSelect={() => setIsRestoreOpen(true)}
            />
          ) : (
            <MenuItem
              icon={ArchiveIcon}
              index={2}
              label="Archive"
              onSelect={() => setIsArchiveOpen(true)}
            />
          )}
          <MenuItem
            icon={Trash2Icon}
            index={3}
            label="Delete"
            onSelect={() => setIsDeleteOpen(true)}
          />
        </DropdownContent>
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

const STATUS_OPTIONS: ColumnMeta["options"] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

interface StudentColumnOptions {
  genderOptions: FilterOption[];
  levelOptions: FilterOption[];
}

/**
 * Column set for the students table. Sorting + filtering are server-side; only
 * the columns the server can order by (`fullName`, `academicLevel`, `status`)
 * are sortable. Select filter options come from the server via `meta.options`.
 */
export const getStudentColumns = ({
  genderOptions,
  levelOptions,
}: StudentColumnOptions) => {
  const columnHelper = createAppColumnHelper<Student>();

  return columnHelper.columns([
    columnHelper.display({
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
      size: 24,
    }),
    columnHelper.accessor("fullName", {
      header: ({ header }) => <DataTableSortableHeader header={header} />,
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
      size: 280,
      meta: {
        label: "Student",
        variant: "text",
      },
    }),
    columnHelper.accessor((row) => row.level?.name, {
      id: "academicLevel",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => row.original.level?.name ?? "-",
      size: 160,
      meta: {
        label: "Level/Year",
        variant: "select",
        options: levelOptions,
      },
    }),
    columnHelper.accessor("status", {
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
      size: 140,
      meta: {
        label: "Status",
        variant: "select",
        options: STATUS_OPTIONS,
      },
    }),
    columnHelper.accessor("gender", {
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.original.gender;
        return gender
          ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
          : "-";
      },
      size: 120,
      enableSorting: false,
      meta: {
        label: "Gender",
        variant: "select",
        options: genderOptions,
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <StudentRowActions student={row.original} />,
      enableSorting: false,
      enableHiding: false,
      size: 80,
    }),
  ]);
};
