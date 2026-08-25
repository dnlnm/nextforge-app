"use client";

import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from "lucide-react";

interface DataTableSortableHeaderProps {
  header: any;
}

/**
 * Click-to-sort column header. Rendered from a column's `header` template, so it
 * receives the header instance directly (no context hook needed).
 */
export function DataTableSortableHeader({ header }: DataTableSortableHeaderProps) {
  const column = header.column;
  const isSorted = column.getIsSorted();
  const label =
    (column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id;

  return (
    <button
      className="flex h-full w-full cursor-pointer items-center justify-between gap-2 text-left select-none"
      onClick={column.getToggleSortingHandler()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          column.getToggleSortingHandler()?.(event);
        }
      }}
      type="button"
    >
      <span>{label}</span>
      {isSorted === "asc" ? (
        <ChevronUpIcon aria-hidden="true" className="size-4 shrink-0 opacity-80" />
      ) : isSorted === "desc" ? (
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 opacity-80" />
      ) : (
        <ChevronsUpDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 opacity-40"
        />
      )}
    </button>
  );
}