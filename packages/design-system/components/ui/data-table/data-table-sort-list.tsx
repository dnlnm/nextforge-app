"use client";

import { ArrowDownUpIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
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
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={<Button variant="elevated" />}
      >
        <ArrowDownUpIcon aria-hidden="true" />
        Sort
        {sorting.length > 0 ? (
          <Badge
            className="h-[1.14rem] rounded-[0.2rem] px-[0.32rem] font-mono font-normal text-[0.65rem]"
            variant="secondary"
          >
            {sorting.length}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverPopup
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
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-0.5">
            {sorting.map((sort) => {
              const column = sortableColumns.find((col) => col.id === sort.id);
              const columnLabel = column?.columnDef.meta?.label ?? sort.id;
              return (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_5rem_2rem] items-center gap-2"
                  key={sort.id}
                >
                  <Select
                    items={sortableColumns
                      .filter(
                        (column) =>
                          !sorting.some(
                            (sortItem) =>
                              sortItem.id === column.id &&
                              sortItem.id !== sort.id
                          )
                      )
                      .map((column) => ({
                        label: column.columnDef.meta?.label ?? column.id,
                        value: column.id,
                      }))}
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
                    value={sort.id}
                  >
                    <SelectTrigger
                      aria-label="Select column to sort by"
                      className="min-w-none"
                      size="sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {sortableColumns
                        .filter(
                          (column) =>
                            !sorting.some(
                              (sortItem) =>
                                sortItem.id === column.id &&
                                sortItem.id !== sort.id
                            )
                        )
                        .map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.columnDef.meta?.label ?? column.id}
                          </SelectItem>
                        ))}
                    </SelectPopup>
                  </Select>

                  <Select
                    items={[
                      { label: "Asc", value: "asc" },
                      { label: "Desc", value: "desc" },
                    ]}
                    onValueChange={(value) =>
                      updateSort(sort.id, { desc: value === "desc" })
                    }
                    value={sort.desc ? "desc" : "asc"}
                  >
                    <SelectTrigger
                      aria-label={`Sort direction for ${columnLabel}`}
                      className="min-w-none"
                      size="sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectPopup>
                  </Select>

                  <Button
                    aria-label={`Remove sort for ${columnLabel}`}
                    className="size-8"
                    onClick={() => removeSort(sort.id)}
                    size="icon"
                    variant="outline"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          <Button
            disabled={sorting.length >= sortableColumns.length}
            onClick={addSort}
            size="sm"
          >
            Add sort
          </Button>
          {sorting.length > 0 ? (
            <Button
              onClick={() => table.resetSorting()}
              size="sm"
              variant="outline"
            >
              Reset
            </Button>
          ) : null}
        </div>
      </PopoverPopup>
    </Popover>
  );
}