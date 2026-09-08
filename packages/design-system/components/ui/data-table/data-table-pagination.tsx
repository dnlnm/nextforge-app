"use client";

import * as React from "react";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/design-system/components/ui/fluid-select";
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
    <div className="flex w-full items-center justify-between gap-2">
      {/* Results range selector */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <p className="text-muted-foreground text-sm">Viewing</p>
        <Select
          onValueChange={(value) => table.setPageIndex(Number(value) - 1)}
          size="compact"
          value={String(pageIndex + 1)}
        >
          <SelectTrigger
            aria-label="Select result range"
            className="w-fit"
          />
          <SelectContent>
            {rangeOptions.map((option, itemIndex) => (
              <SelectItem
                index={itemIndex}
                key={option.value}
                value={String(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">
          of{" "}
          <strong className="font-medium text-foreground">{totalCount}</strong>{" "}
          results
        </p>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous page"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="icon"
          variant="tertiary"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Button
          aria-label="Next page"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="icon"
          variant="tertiary"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}