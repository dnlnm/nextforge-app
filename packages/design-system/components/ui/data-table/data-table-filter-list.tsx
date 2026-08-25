"use client";

import { ListFilterIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
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
import { getFilterOperators } from "./lib/data-table";
import { useTableContext } from "./table";
import type { ExtendedColumnFilter, FilterOperator, JoinOperator } from "./types";
import { Faceted } from "./faceted";

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
    filter: ExtendedColumnFilter
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
      <Input
        className="h-8"
        onChange={(event) =>
          updateFilter(filter.filterId as string, { value: event.target.value })
        }
        placeholder={`Search ${columnLabel}...`}
        type="text"
        value={(filter.value ?? "") as string}
      />
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
        className="grid grid-cols-[3.5rem_8rem_7.5rem_minmax(0,1fr)_2rem] items-center gap-2"
        key={filter.filterId}
      >
        {index === 0 ? (
          <span className="text-center text-muted-foreground text-sm">Where</span>
        ) : (
          <Select
            items={[
              { label: "and", value: "and" },
              { label: "or", value: "or" },
            ]}
            onValueChange={(value) => {
              if (filter.filterId) {
                updateFilter(filter.filterId, {
                  joinOperator: value as JoinOperator,
                });
              }
            }}
            value={(filter.joinOperator ?? "and") as JoinOperator}
          >
            <SelectTrigger aria-label="Select join operator" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="and">and</SelectItem>
              <SelectItem value="or">or</SelectItem>
            </SelectPopup>
          </Select>
        )}

        <Select
          items={filterableColumns.map((col) => ({
            label: col.columnDef.meta?.label ?? col.id,
            value: col.id,
          }))}
          onValueChange={(value) => {
            if (filter.filterId) {
              updateFilter(filter.filterId, { id: value as string });
            }
          }}
          value={filter.id}
        >
          <SelectTrigger aria-label="Select filter field" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {filterableColumns.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.columnDef.meta?.label ?? col.id}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        <Select
          items={operators.map((operator) => ({
            label: operator.label,
            value: operator.value,
          }))}
          onValueChange={(value) => {
            if (filter.filterId) {
              updateFilter(filter.filterId, {
                operator: value as FilterOperator,
              });
            }
          }}
          value={(filter.operator ?? operators[0].value) as FilterOperator}
        >
          <SelectTrigger aria-label="Select filter operator" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {operators.map((operator) => (
              <SelectItem key={operator.value} value={operator.value}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        {renderValueInput(column, filter)}

        <Button
          aria-label={`Remove ${columnLabel} filter`}
          className="size-8"
          onClick={() => removeFilter(filter.filterId as string)}
          size="icon"
          variant="outline"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button className="[&_svg]:size-3" size="sm" variant="outline" />
        }
      >
        <ListFilterIcon aria-hidden="true" />
        Filter
        {columnFilters.length > 0 ? (
          <Badge
            className="h-[1.14rem] rounded-[0.2rem] px-[0.32rem] font-mono font-normal text-[0.65rem]"
            variant="secondary"
          >
            {columnFilters.length}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        className="flex min-w-80 max-w-[38rem] flex-col gap-3 p-4"
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
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-0.5">
            {columnFilters.map((filter, index) => (
              <React.Fragment key={filter.filterId}>
                {renderFilterRow(filter, index)}
              </React.Fragment>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button onClick={addFilter} size="sm">
            Add filter
          </Button>
          {columnFilters.length > 0 ? (
            <Button
              onClick={() => setColumnFilters([])}
              size="sm"
              variant="outline"
            >
              Reset filters
            </Button>
          ) : null}
        </div>
      </PopoverPopup>
    </Popover>
  );
}