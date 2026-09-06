"use client";

import { ListFilterIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { InputField, InputGroup } from "@repo/design-system/components/ui/fluid-input-group";
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
import { getFilterOperators } from "./lib/data-table";
import { useTableContext } from "./table";
import type { ExtendedColumnFilter, FilterOperator, JoinOperator } from "./types";
import { Faceted } from "./fluid-faceted";

function getColumnOptions(column: {
  columnDef: { meta?: { options?: Array<{ label: string; value: string }> } };
}) {
  return column.columnDef.meta?.options ?? [];
}

function getColumnVariant(column: {
  columnDef: { meta?: { variant?: string } };
}) {
  return column.columnDef.meta?.variant ?? "text";
}

export function DataTableFilterList() {
  const table = useTableContext();
  const [open, setOpen] = React.useState(false);
  const columnFilters = table.state
    .columnFilters as ExtendedColumnFilter[];

  const setColumnFilters = (filters: ExtendedColumnFilter[]) => {
    table.options.onColumnFiltersChange?.(filters);
  };

  const filterableColumns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );

  const addFilter = React.useCallback(() => {
    const firstColumn = filterableColumns[0];
    if (!firstColumn) return;
    const variant = getColumnVariant(firstColumn);
    const operators = getFilterOperators(variant);
    const next: ExtendedColumnFilter = {
      id: firstColumn.id,
      value: variant === "multi-select" ? [] : "",
      operator: operators[0].value,
      filterId: crypto.randomUUID(),
      joinOperator: "and",
    };
    setColumnFilters([...columnFilters, next]);
  }, [columnFilters, filterableColumns]);

  const updateFilter = React.useCallback(
    (filterId: string, updates: Partial<Omit<ExtendedColumnFilter, "filterId">>) => {
      const next = columnFilters.map((filter) => {
        if (filter.filterId !== filterId) return filter;
        if (updates.id && updates.id !== filter.id) {
          const column = filterableColumns.find((col) => col.id === updates.id);
          const variant = getColumnVariant(column ?? { columnDef: {} });
          const operators = getFilterOperators(variant);
          return {
            ...filter,
            ...updates,
            operator: operators[0].value,
            value: variant === "multi-select" ? [] : "",
          };
        }
        return { ...filter, ...updates };
      });
      setColumnFilters(next);
    },
    [columnFilters, filterableColumns]
  );

  const removeFilter = React.useCallback(
    (filterId: string) => {
      setColumnFilters(columnFilters.filter((filter) => filter.filterId !== filterId));
    },
    [columnFilters]
  );

  const renderValueInput = (
    column: { id: string; columnDef: { meta?: { label?: string; variant?: string; options?: Array<{ label: string; value: string }> } } },
    filter: ExtendedColumnFilter,
    index: number
  ) => {
    const variant = getColumnVariant(column);
    const columnLabel = column.columnDef.meta?.label ?? column.id;

    if (variant === "select" || variant === "multi-select") {
      const options = getColumnOptions(column);
      const value = Array.isArray(filter.value)
        ? (filter.value as string[])
        : filter.value !== undefined && filter.value !== ""
          ? [String(filter.value)]
          : [];
      return (
        <Faceted
          multiple={variant === "multi-select"}
          onValueChange={(next) => {
            updateFilter(filter.filterId as string, {
              value: Array.isArray(next) ? next : [String(next)],
            });
          }}
          options={options}
          placeholder={`Select ${columnLabel}...`}
          value={value}
        />
      );
    }

    return (
      <InputGroup className="w-full min-w-0">
        <InputField
          index={index}
          label={`Search ${columnLabel}`}
          labelHidden
          onChange={(value) =>
            updateFilter(filter.filterId as string, { value })
          }
          placeholder={`Search ${columnLabel}...`}
          type="text"
          value={(filter.value ?? "") as string}
        />
      </InputGroup>
    );
  };

  const renderFilterRow = (filter: ExtendedColumnFilter, index: number) => {
    const column = table.getColumn(filter.id);
    if (!column) return null;
    const variant = getColumnVariant(column);
    const operators = getFilterOperators(variant);
    const columnLabel = column.columnDef.meta?.label ?? column.id;

    return (
      <div
        className="grid grid-cols-[70px_9rem_8.5rem_minmax(0,14rem)_2rem] items-center gap-2"
        key={filter.filterId}
      >
        {index === 0 ? (
          <span className="text-center text-muted-foreground text-sm">Where</span>
        ) : (
          <Select
            onValueChange={(value) => {
              if (filter.filterId) {
                updateFilter(filter.filterId, {
                  joinOperator: value as JoinOperator,
                });
              }
            }}
            size="compact"
            value={(filter.joinOperator ?? "and") as JoinOperator}
          >
            <SelectTrigger aria-label="Select join operator" />
            <SelectContent>
              <SelectItem index={0} value="and">
                and
              </SelectItem>
              <SelectItem index={1} value="or">
                or
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          onValueChange={(value) => {
            if (filter.filterId) {
              updateFilter(filter.filterId, { id: value as string });
            }
          }}
          size="compact"
          value={filter.id}
        >
          <SelectTrigger aria-label="Select filter field" />
          <SelectContent>
            {filterableColumns.map((col, itemIndex) => (
              <SelectItem
                index={itemIndex}
                key={col.id}
                value={col.id}
              >
                {col.columnDef.meta?.label ?? col.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => {
            if (filter.filterId) {
              updateFilter(filter.filterId, {
                operator: value as FilterOperator,
              });
            }
          }}
          size="compact"
          value={(filter.operator ?? operators[0].value) as FilterOperator}
        >
          <SelectTrigger aria-label="Select filter operator" />
          <SelectContent>
            {operators.map((operator, itemIndex) => (
              <SelectItem
                index={itemIndex}
                key={operator.value}
                value={operator.value}
              >
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {renderValueInput(column, filter, index)}

        <Button
          aria-label={`Remove ${columnLabel} filter`}
          onClick={() => removeFilter(filter.filterId as string)}
          size="icon-compact"
          variant="ghost"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <FluidPopover onOpenChange={setOpen} open={open}>
      <FluidPopoverTrigger
        render={<Button variant="tertiary" />}
      >
        <ListFilterIcon aria-hidden="true" className="size-4" />
        Filter
        {columnFilters.length > 0 ? (
          <Badge
            className="font-mono"
            color="gray"
            size="compact"
            variant="solid"
          >
            {columnFilters.length}
          </Badge>
        ) : null}
      </FluidPopoverTrigger>
      <FluidPopoverContent
        align="start"
        className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-2 p-3"
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">Filters</h4>
          <p className="text-muted-foreground text-sm">
            {columnFilters.length > 0
              ? "Modify filters to refine your results."
              : "Add filters to refine your results."}
          </p>
        </div>

        {columnFilters.length > 0 ? (
          <ScrollArea
            className="max-h-[300px]"
            viewportClassName="scroll-fade"
          >
            <SizeProvider size="compact">
              <div className="flex flex-col gap-2 p-0.5">
                {columnFilters.map((filter, index) => (
                  <React.Fragment key={filter.filterId}>
                    {renderFilterRow(filter, index)}
                  </React.Fragment>
                ))}
              </div>
            </SizeProvider>
          </ScrollArea>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Button onClick={addFilter} size="compact" variant="primary">
            Add filter
          </Button>
          {columnFilters.length > 0 ? (
            <Button
              onClick={() => setColumnFilters([])}
              size="compact"
              variant="tertiary"
            >
              Reset filters
            </Button>
          ) : null}
        </div>
      </FluidPopoverContent>
    </FluidPopover>
  );
}
