"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  CardFrame,
  CardFrameFooter,
} from "@repo/design-system/components/ui/card";
import {
  type ExtendedColumnFilter,
  toFilterValueArray,
  useAppTable,
} from "@repo/design-system/components/ui/data-table/table";
import { Input } from "@repo/design-system/components/ui/input";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import { formatMoney as formatMoneyShared } from "@repo/money";
import type { InvoiceStatus } from "@repo/schemas/enums";
import type { InvoicesQueryParams } from "@repo/schemas/invoices";
import { flexRender, type RowSelectionState } from "@tanstack/react-table";
import { BanIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { getInvoicesForTable, voidInvoices } from "./actions";
import { createColumns, type Invoice } from "./columns";
import { STATUS_TABS } from "./invoices-labels";

interface FilterOption {
  label: string;
  value: string;
}

interface InvoicesTableProps {
  currency: string;
  filterOptions: { months: FilterOption[] };
  initialData: Invoice[];
  initialTotalCount: number;
  onSelectInvoice: (invoice: Invoice) => void;
  statusCounts: Partial<Record<InvoiceStatus | "all", number>> & {
    all?: number;
  };
}

const FILTERS_SCHEMA = z.array(
  z.object({ id: z.string(), value: z.unknown() })
);

// Stable keys for the 5 skeleton rows.
const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

export function InvoicesTable({
  currency,
  filterOptions,
  initialData,
  initialTotalCount,
  onSelectInvoice,
  statusCounts,
}: InvoicesTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [urlParams, setUrlParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(""),
      filters: parseAsJson((value) => {
        const parsed = FILTERS_SCHEMA.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([] as Array<{ id: string; value: unknown }>),
      sorting: parseAsJson((value) => {
        const parsed = z
          .array(z.object({ desc: z.boolean(), id: z.string() }))
          .safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
      status: parseAsString.withDefault("all"),
    },
    { history: "replace" }
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / urlParams.pageSize));
  const selectedInvoiceIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  // Fold the status tab (URL param, not a column filter) into the wire filters.
  const serverFilters = useMemo(() => {
    const filters: Array<{ id: string; value: unknown }> = [
      ...urlParams.filters,
    ];

    if (urlParams.status !== "all") {
      filters.push({ id: "status", value: [urlParams.status] });
    }

    return filters;
  }, [urlParams]);

  // Serialize UI filters ({id, value[]}) from the v9 filter list.
  const serializeFilters = useCallback(
    (filters: ExtendedColumnFilter[]): Array<{ id: string; value: unknown }> =>
      filters
        .filter((filter) => filter.id)
        .map((filter) => ({
          id: filter.id,
          value: toFilterValueArray(filter.value),
        })),
    []
  );

  const hydrateFilters = useCallback(
    (filters: Array<{ id: string; value: unknown }>): ExtendedColumnFilter[] =>
      filters.map((filter, index) => ({
        id: filter.id,
        value: toFilterValueArray(filter.value),
        operator: "equals",
        joinOperator: "and",
        variant: "select",
        filterId: `${filter.id}-${index}`,
      })),
    []
  );

  const hydratedFilters = useMemo(
    () => hydrateFilters(urlParams.filters),
    [hydrateFilters, urlParams.filters]
  );

  const formatMoney = useMemo(
    () => (amountSen: number) => formatMoneyShared(amountSen, { currency }),
    [currency]
  );

  const columns = useMemo(
    () =>
      createColumns(formatMoney, onSelectInvoice, {
        months: filterOptions.months,
      }),
    [formatMoney, onSelectInvoice, filterOptions.months]
  );

  const table = useAppTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: {
      columnFilters: hydratedFilters,
      pagination: {
        pageIndex: urlParams.page,
        pageSize: urlParams.pageSize,
      },
      rowSelection,
      sorting: urlParams.sorting,
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(hydratedFilters) : updater;
      setUrlParams({ filters: serializeFilters(next), page: 0 });
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({
              pageIndex: urlParams.page,
              pageSize: urlParams.pageSize,
            })
          : updater;
      setUrlParams({ page: next.pageIndex, pageSize: next.pageSize });
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((previous) =>
        typeof updater === "function" ? updater(previous) : updater
      );
    },
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(urlParams.sorting) : updater;
      setUrlParams({ sorting: next, page: 0 });
    },
    meta: { totalCount },
  });

  const requestIdRef = useRef(0);
  const [debouncedSearch, setDebouncedSearch] = useState(urlParams.search);

  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(urlParams.search),
      250
    );
    return () => window.clearTimeout(handle);
  }, [urlParams.search]);

  const fetchInvoices = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const params: InvoicesQueryParams = {
        page: urlParams.page,
        pageSize: urlParams.pageSize,
        search: debouncedSearch || undefined,
        filters: serverFilters.length > 0 ? serverFilters : undefined,
        sorting: urlParams.sorting.length > 0 ? urlParams.sorting : undefined,
      };

      const result = await getInvoicesForTable(params);

      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, serverFilters, urlParams]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Re-fetch when the server-side data changes (e.g. invoices generated/voided).
  const prevInitial = useRef({ data: initialData, total: initialTotalCount });

  useEffect(() => {
    if (
      prevInitial.current.data !== initialData ||
      prevInitial.current.total !== initialTotalCount
    ) {
      prevInitial.current = { data: initialData, total: initialTotalCount };
      fetchInvoices();
    }
  }, [fetchInvoices, initialData, initialTotalCount]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const handleVoidSelected = useCallback(
    async (formData: FormData) => {
      await voidInvoices(formData);
      router.refresh();
      clearSelection();
    },
    [clearSelection, router]
  );

  const handleRowClick = useCallback(
    (row: Invoice) => {
      onSelectInvoice(row);
    },
    [onSelectInvoice]
  );

  const renderBody = () => {
    if (isLoading) {
      return SKELETON_ROW_KEYS.map((key) => (
        <TableRow key={key}>
          {columns.map((column) => (
            <TableCell key={column.id}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    const rows = table.getRowModel().rows;

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell className="h-24 text-center" colSpan={columns.length}>
            No invoices found.
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <TableRow
        className="cursor-pointer"
        data-state={row.getIsSelected() ? "selected" : undefined}
        key={row.id}
        onClick={() => handleRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <CardFrame className="isolate after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 dark:bg-background">
      <table.AppTable>
        <div className="grid gap-4 p-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) =>
                  setUrlParams({ search: event.target.value, page: 0 })
                }
                placeholder="Search student, guardian, or invoice number..."
                type="search"
                value={urlParams.search}
              />
            </div>
            <table.FilterList />
            <table.SortList />
          </div>
        </div>

        {/* Status tabs (mirrors the reference page's underline tabs). */}
        <Tabs
          className="border-b px-4 pt-1"
          onValueChange={(value) =>
            setUrlParams({ status: value ?? "all", page: 0 })
          }
          value={urlParams.status}
        >
          <TabsList variant="underline">
            {STATUS_TABS.map((tab) => (
              <TabsTab key={tab.value} value={tab.value}>
                {tab.label}
                <span className="rounded-full bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-xs">
                  {(statusCounts[tab.value] ?? 0).toLocaleString()}
                </span>
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>

        {/* Bulk action bar */}
        {selectedInvoiceIds.length > 0 ? (
          <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2.5">
            <span className="font-semibold text-primary text-xs">
              {selectedInvoiceIds.length} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <form action={handleVoidSelected}>
              <input
                name="invoiceIds"
                type="hidden"
                value={JSON.stringify(selectedInvoiceIds)}
              />
              <Button
                className="h-auto px-2 py-1 font-medium text-destructive text-xs hover:bg-destructive/5 hover:text-destructive"
                type="submit"
                variant="ghost"
              >
                <BanIcon className="size-3.5" />
                Void selected
              </Button>
            </form>
            <button
              aria-label="Clear selection"
              className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
              onClick={clearSelection}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto px-4">
          <Table className="table-fixed" variant="card">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnSize = header.column.getSize();
                    return (
                      <TableHead
                        key={header.id}
                        style={
                          columnSize ? { width: `${columnSize}px` } : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>{renderBody()}</TableBody>
          </Table>
        </div>

        <CardFrameFooter className="p-2">
          <table.Pagination />
        </CardFrameFooter>
      </table.AppTable>
    </CardFrame>
  );
}
