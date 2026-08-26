"use client";

import * as React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { useTableContext } from "./table";

export function DataTablePagination() {
  const table = useTableContext();
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = table.getPageCount();
  const totalCount = table.options.meta?.totalCount ?? 0;

  const rangeOptions = React.useMemo(() => {
    return Array.from({ length: pageCount }, (_, index) => {
      const start = index * pageSize + 1;
      const end = Math.min((index + 1) * pageSize, totalCount);
      return { label: `${start}-${end}`, value: index + 1 };
    });
  }, [pageCount, pageSize, totalCount]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
      {/* Results range selector */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-sm">Viewing</p>
        <Select
          items={rangeOptions}
          onValueChange={(value) => table.setPageIndex((value as number) - 1)}
          value={pageIndex + 1}
        >
          <SelectTrigger
            aria-label="Select result range"
            className="w-auto min-w-[5rem] shrink-0"
            size="sm"
          >
            <SelectValue className="flex-none" />
          </SelectTrigger>
          <SelectPopup>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <p className="text-muted-foreground text-sm">
          of{" "}
          <strong className="font-medium text-foreground">{totalCount}</strong>{" "}
          results
        </p>
      </div>

      {/* Pagination */}
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="sm:*:[svg]:hidden"
              render={
                <Button
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  size="sm"
                  variant="outline"
                />
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}