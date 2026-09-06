"use client";

import { ArrowDownUpIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  FluidPopover,
  FluidPopoverContent,
  FluidPopoverTrigger,
} from "@repo/design-system/components/ui/fluid-popover";
import { ScrollArea } from "@repo/design-system/components/ui/fluid-scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/design-system/components/ui/fluid-select";
import { SizeProvider } from "@repo/design-system/lib/size-context";
import { useTableContext } from "./table";

export function DataTableSortList() {
  const table = useTableContext();
  const [open, setOpen] = React.useState(false);
  const sorting = table.state.sorting;

  const sortableColumns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanSort()),
    [table]
  );

  const addSort = React.useCallback(() => {
    const firstAvailable = sortableColumns.find(
      (column) => !sorting.some((sort) => sort.id === column.id)
    );
    if (firstAvailable) {
      table.setSorting([...sorting, { id: firstAvailable.id, desc: false }]);
    }
  }, [sorting, sortableColumns, table]);

  const updateSort = React.useCallback(
    (sortId: string, updates: Partial<{ desc: boolean }>) => {
      table.setSorting(
        sorting.map((sort) => (sort.id === sortId ? { ...sort, ...updates } : sort))
      );
    },
    [sorting, table]
  );

  const removeSort = React.useCallback(
    (sortId: string) => {
      table.setSorting(sorting.filter((sort) => sort.id !== sortId));
    },
    [sorting, table]
  );

  return (
    <FluidPopover onOpenChange={setOpen} open={open}>
      <FluidPopoverTrigger
        render={<Button variant="tertiary" />}
      >
        <ArrowDownUpIcon aria-hidden="true" className="size-4" />
        Sort
        {sorting.length > 0 ? (
          <Badge
            className="font-mono"
            color="gray"
            size="compact"
            variant="solid"
          >
            {sorting.length}
          </Badge>
        ) : null}
      </FluidPopoverTrigger>
      <FluidPopoverContent
        align="start"
        className="flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2 p-3"
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">
            {sorting.length > 0 ? "Sort by" : "No sorting applied"}
          </h4>
          <p className="text-muted-foreground text-sm">
            {sorting.length > 0
              ? "Modify sorting to organize your results."
              : "Add sorting to organize your results."}
          </p>
        </div>

        {sorting.length > 0 ? (
          <ScrollArea
            className="max-h-[300px]"
            viewportClassName="scroll-fade"
          >
            <SizeProvider size="compact">
              <div className="flex flex-col gap-2 p-0.5">
                {sorting.map((sort) => {
                  const column = sortableColumns.find((col) => col.id === sort.id);
                  const columnLabel = column?.columnDef.meta?.label ?? sort.id;
                  const availableColumns = sortableColumns.filter(
                    (column) =>
                      !sorting.some(
                        (sortItem) =>
                          sortItem.id === column.id &&
                          sortItem.id !== sort.id
                      )
                  );
                  return (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_5rem_2rem] items-center gap-2"
                      key={sort.id}
                    >
                      <Select
                        onValueChange={(value) => {
                          const nextId = value as string;
                          table.setSorting(
                            sorting.map((sortItem) =>
                              sortItem.id === sort.id
                                ? { ...sortItem, id: nextId }
                                : sortItem
                            )
                          );
                        }}
                        size="compact"
                        value={sort.id}
                      >
                        <SelectTrigger
                          aria-label="Select column to sort by"
                        />
                        <SelectContent>
                          {availableColumns.map((column, itemIndex) => (
                            <SelectItem
                              index={itemIndex}
                              key={column.id}
                              value={column.id}
                            >
                              {column.columnDef.meta?.label ?? column.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) =>
                          updateSort(sort.id, { desc: value === "desc" })
                        }
                        size="compact"
                        value={sort.desc ? "desc" : "asc"}
                      >
                        <SelectTrigger
                          aria-label={`Sort direction for ${columnLabel}`}
                        />
                        <SelectContent>
                          <SelectItem index={0} value="asc">
                            Asc
                          </SelectItem>
                          <SelectItem index={1} value="desc">
                            Desc
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        aria-label={`Remove sort for ${columnLabel}`}
                        onClick={() => removeSort(sort.id)}
                        size="icon-compact"
                        variant="ghost"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </SizeProvider>
          </ScrollArea>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          <Button
            disabled={sorting.length >= sortableColumns.length}
            onClick={addSort}
            size="compact"
            variant="primary"
          >
            Add sort
          </Button>
          {sorting.length > 0 ? (
            <Button
              onClick={() => table.resetSorting()}
              size="compact"
              variant="tertiary"
            >
              Reset
            </Button>
          ) : null}
        </div>
      </FluidPopoverContent>
    </FluidPopover>
  );
}
