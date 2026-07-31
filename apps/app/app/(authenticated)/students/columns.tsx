"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { DataTableColumnHeader } from "@repo/design-system/components/niko-table/components/data-table-column-header";
import { DataTableColumnTitle } from "@repo/design-system/components/niko-table/components/data-table-column-title";
import { DataTableSortMenu } from "@repo/design-system/components/niko-table/components/data-table-sort-menu";
import { DataTableColumnFacetedFilterMenu } from "@repo/design-system/components/niko-table/components/data-table-column-faceted-filter";
import type { DataTableColumnDef } from "@repo/design-system/components/niko-table/types";
import { Edit3Icon, EyeIcon, MoreHorizontalIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

export type Student = {
  id: string;
  fullName: string;
  status: string;
  academicLevel: string | null;
  class?: never;
  tutor?: never;
  guardians: Array<{
    guardian: {
      phone: string | null;
    };
  }>;
};

const studentCode = (index: number) =>
  `STU${String(index + 145).padStart(5, "0")}`;

export const columns: DataTableColumnDef<Student>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableSortMenu />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
          <UserRoundIcon className="size-5" />
        </div>
        <Link
          className="font-medium hover:underline"
          href={`/students/${row.original.id}`}
        >
          {row.original.fullName}
        </Link>
      </div>
    ),
    meta: {
      label: "Student",
    },
    enableHiding: false,
  },
  {
    id: "studentId",
    header: "Student ID",
    cell: ({ row, table }) => {
      const index = table.getSortedRowModel().rows.indexOf(row);
      return (
        <span className="text-muted-foreground">
          {studentCode(index)}
        </span>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "academicLevel",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableSortMenu />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => row.original.academicLevel ?? "-",
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
        <DataTableSortMenu />
        <DataTableColumnFacetedFilterMenu multiple />
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
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button asChild size="icon" variant="outline">
            <Link href={`/students/${row.original.id}`}>
              <EyeIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="outline">
            <Link href={`/students/${row.original.id}/edit`}>
              <Edit3Icon className="size-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="outline">
            <Link href={`https://wa.me/${guardian?.phone ?? ""}`}>
              <MoreHorizontalIcon className="size-4" />
            </Link>
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
