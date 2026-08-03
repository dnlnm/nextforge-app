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
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";

import { archiveStudent } from "./actions";

export type Student = {
  id: string;
  fullName: string;
  status: string;
  code: string;
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
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <UserRoundIcon className="size-5" />
          </div>
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
        {row.original.status === "ACTIVE" ? "Active" : "Inactive"}
      </Badge>
    ),
    meta: {
      label: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
      ],
      variant: "select",
    },
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const guardian = row.original.guardians[0]?.guardian;
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
                <Link href={`/students/${row.original.id}`}>
                  <EyeIcon />
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/students/${row.original.id}/edit`}>
                  <Edit3Icon />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={
                    guardian?.phone ? `https://wa.me/${guardian.phone}` : "#"
                  }
                >
                  <MessageCircleIcon />
                  WhatsApp
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <form
                  action={archiveStudent}
                  onSubmit={(e) => {
                    if (!window.confirm("Archive this student?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input
                    name="studentId"
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
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
