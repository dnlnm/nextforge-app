"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import {
  createAppColumnHelper,
  useAppTable,
} from "@repo/design-system/components/ui/data-table/table";
import { Input } from "@repo/design-system/components/ui/input";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { MoreHorizontalIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export interface ClassTableItem {
  readonly capacity: number | null;
  readonly code: string;
  readonly enrollments: readonly { readonly id: string }[];
  readonly id: string;
  readonly level: { readonly name: string } | null;
  readonly name: string;
  readonly schedules: readonly {
    readonly dayOfWeek: string;
    readonly endsAt: string;
    readonly startsAt: string;
    readonly room: { readonly name: string } | null;
  }[];
  readonly status: string;
  readonly subject: { readonly name: string } | null;
  readonly teacher: { readonly fullName: string } | null;
}

const whitespaceRegex = /\s+/;

const teacherInitials = (name?: string | null) =>
  name
    ?.split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase() || "--";

export const ClassesTable = ({ classes }: { classes: ClassTableItem[] }) => {
  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          classes.map((item) => item.subject?.name).filter((name): name is string => Boolean(name)),
        ),
      )
        .sort()
        .map((name) => ({ label: name, value: name })),
    [classes],
  );
  const levels = useMemo(
    () =>
      Array.from(new Set(classes.map((item) => item.level?.name ?? "General")))
        .sort()
        .map((name) => ({ label: name, value: name })),
    [classes],
  );

  const columnHelper = createAppColumnHelper<ClassTableItem>();
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "index",
          header: "#",
          cell: ({ row }) => row.index + 1,
          enableSorting: false,
          enableColumnFilter: false,
          size: 56,
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Class Name",
          cell: ({ row }) => (
            <div className="grid gap-1">
              <Link className="font-medium hover:underline" href={`/classes/${row.original.id}`}>
                {row.original.name}
              </Link>
              <span className="text-muted-foreground text-xs">{row.original.code}</span>
            </div>
          ),
          meta: { label: "Class Name", variant: "text" },
          enableColumnFilter: true,
          size: 180,
        }),
        columnHelper.accessor((row) => row.subject?.name ?? "", {
          id: "subject",
          header: "Subject",
          cell: ({ row }) => <Badge variant="secondary">{row.original.subject?.name ?? "—"}</Badge>,
          meta: { label: "Subject", variant: "multi-select", options: subjects },
          enableColumnFilter: true,
          size: 140,
        }),
        columnHelper.accessor((row) => row.level?.name ?? "General", {
          id: "level",
          header: "Level",
          cell: ({ row }) => (
            <Badge variant="secondary">{row.original.level?.name ?? "General"}</Badge>
          ),
          meta: { label: "Level", variant: "multi-select", options: levels },
          enableColumnFilter: true,
          size: 140,
        }),
        columnHelper.accessor((row) => row.teacher?.fullName ?? "", {
          id: "teacher",
          header: "Teacher",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground text-xs">
                {teacherInitials(row.original.teacher?.fullName)}
              </div>
              <span>{row.original.teacher?.fullName ?? "-"}</span>
            </div>
          ),
          meta: { label: "Teacher", variant: "text" },
          enableColumnFilter: true,
          size: 160,
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge variant="outline">{row.original.status === "ACTIVE" ? "Active" : "Upcoming"}</Badge>
          ),
          meta: {
            label: "Status",
            variant: "select",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Upcoming", value: "UPCOMING" },
            ],
          },
          enableColumnFilter: true,
          size: 110,
        }),
        columnHelper.display({
          id: "actions",
          header: () => <div className="text-right">Action</div>,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <Button render={<Link href={`/classes/${row.original.id}`} />} size="icon" variant="outline">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </div>
          ),
          enableSorting: false,
          enableColumnFilter: false,
          size: 80,
        }),
      ]),
    [levels, subjects],
  );

  const table = useAppTable({
    columns,
    data: classes,
  });

  const hasActiveState =
    !!table.state.globalFilter ||
    table.state.columnFilters.length > 0 ||
    table.state.sorting.length > 0;

  return (
    <table.AppTable>
      <PreviewCard
        header={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                placeholder="Search classes by name, code or subject..."
                value={(table.state.globalFilter as string) ?? ""}
              />
            </div>
            <div className="flex items-center gap-2">
              {hasActiveState ? (
                <Button
                  onClick={() => {
                    table.resetGlobalFilter();
                    table.resetColumnFilters();
                    table.resetSorting();
                  }}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcwIcon aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
              <table.FilterList />
              <table.SortList />
            </div>
          </div>
        }
        footer={<table.Pagination />}
        stageClassName="flex-col items-stretch justify-start overflow-hidden p-0 sm:p-0"
      >
        <div className="hidden min-h-0 w-full overflow-x-auto md:block">
          <Table className="w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="border-border hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnSize = header.column.getSize();
                    return (
                      <TableHead
                        key={header.id}
                        style={columnSize ? { width: `${columnSize}px` } : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow className="border-0">
                  <TableCell className="h-24 text-center" colSpan={columns.length}>
                    No classes found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow className="border-border last:border-0" key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Separator className="bg-border/60" />
        </div>
        <div className="px-4 md:hidden">
          <div className="grid gap-3">
            {table.getRowModel().rows.map((row) => {
              const item = row.original;
              return (
                <div className="rounded-lg border bg-card p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link className="font-medium hover:underline" href={`/classes/${item.id}`}>
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">{item.code}</p>
                    </div>
                    <Badge variant="outline">
                      {item.status === "ACTIVE" ? "Active" : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="grid gap-1 pt-3 text-xs">
                    <span className="text-muted-foreground">
                      {item.subject?.name ?? "—"} · {item.level?.name ?? "General"}
                    </span>
                    <span>{item.teacher?.fullName ?? "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PreviewCard>
    </table.AppTable>
  );
};
