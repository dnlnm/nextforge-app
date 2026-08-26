"use client";

interface DataTableSortableHeaderProps {
  header: any;
}

/**
 * Column header label. Sorting is done exclusively through the Sort popover;
 * column-header clicks are disabled, so this renders the label only.
 */
export function DataTableSortableHeader({ header }: DataTableSortableHeaderProps) {
  const label =
    (header.column.columnDef.meta as { label?: string } | undefined)?.label ??
    header.column.id;

  return <span>{label}</span>;
}