"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { createAppColumnHelper } from "@repo/design-system/components/ui/data-table/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  EyeIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";

import { archiveTeacher } from "./actions";

export interface Teacher {
  branchName: string | null;
  classCount: number;
  code: string;
  email: string | null;
  fullName: string;
  id: string;
  phone: string | null;
  status: string;
  subjects: string[];
}

export interface FilterOption {
  label: string;
  value: string;
}

interface TeacherColumnOptions {
  branchOptions: FilterOption[];
  subjectOptions: FilterOption[];
}

export const createColumns = ({
  branchOptions,
  subjectOptions,
}: TeacherColumnOptions) => {
  const columnHelper = createAppColumnHelper<Teacher>();

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
    }),
    columnHelper.accessor("fullName", {
      header: "Teacher",
      cell: ({ row }) => {
        return (
          <div className="flex max-w-full items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
              <UserRoundIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                className="block truncate font-medium hover:underline"
                href={`/teachers?teacherId=${row.original.id}`}
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
      meta: { label: "Teacher" },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
      size: 280,
    }),
    columnHelper.accessor((row) => row.subjects, {
      id: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="flex max-w-56 flex-wrap gap-1.5">
          {row.original.subjects.length > 0 ? (
            row.original.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
      meta: {
        label: "Subject",
        variant: "multi-select",
        options: subjectOptions,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("classCount", {
      header: "Classes",
      cell: ({ row }) => row.original.classCount,
      meta: { label: "Classes" },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor((row) => row.branchName, {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => row.original.branchName ?? "-",
      meta: {
        label: "Branch",
        variant: "multi-select",
        options: branchOptions,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "-",
      meta: { label: "Phone" },
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: ({ row }) => row.original.email ?? "-",
      meta: { label: "Email" },
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.status, {
      id: "status",
      header: "Status",
      cell: () => <Badge variant="outline">Active</Badge>,
      meta: {
        label: "Status",
        variant: "select",
        options: [{ label: "Active", value: "ACTIVE" }],
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
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
              <DropdownMenuItem
                render={
                  <Link href={`/teachers?teacherId=${row.original.id}`} />
                }
              >
                <EyeIcon />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link
                    href={
                      row.original.phone
                        ? `https://wa.me/${row.original.phone}`
                        : "#"
                    }
                  />
                }
              >
                <MessageCircleIcon />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <form
                  action={archiveTeacher}
                  onSubmit={(e) => {
                    if (!window.confirm("Archive this teacher?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input
                    name="teacherId"
                    type="hidden"
                    value={row.original.id}
                  />
                  <button className="flex items-center gap-2" type="submit">
                    <ArchiveIcon />
                    Archive
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ]);
};
