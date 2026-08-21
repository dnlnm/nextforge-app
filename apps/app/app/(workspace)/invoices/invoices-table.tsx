"use client";

import { DataTableClearFilter } from "@repo/design-system/components/niko-table/components/data-table-clear-filter";
import { DataTableFacetedFilter } from "@repo/design-system/components/niko-table/components/data-table-faceted-filter";
import { DataTablePagination } from "@repo/design-system/components/niko-table/components/data-table-pagination";
import { DataTableSearchFilter } from "@repo/design-system/components/niko-table/components/data-table-search-filter";
import { DataTableToolbarSection } from "@repo/design-system/components/niko-table/components/data-table-toolbar-section";
import { DataTable } from "@repo/design-system/components/niko-table/core/data-table";
import { DataTableRoot } from "@repo/design-system/components/niko-table/core/data-table-root";
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
  DataTableSkeleton,
} from "@repo/design-system/components/niko-table/core/data-table-structure";
import type { GlobalFilter } from "@repo/design-system/components/niko-table/types";
import { Button } from "@repo/design-system/components/ui/button";
import { CardContent } from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import {
  Tabs,
  TabsList,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import { formatMoney as formatMoneyShared } from "@repo/money";
import type { InvoiceStatus } from "@repo/schemas/enums";
import type { InvoicesQueryParams } from "@repo/schemas/invoices";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { BanIcon, XIcon } from "lucide-react";
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
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);

  const filtersSchema = z.array(
    z.object({ id: z.string(), value: z.unknown() })
  );
  const sortingSchema = z.array(
    z.object({ desc: z.boolean(), id: z.string() })
  );

  const [urlParams, setUrlParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(""),
      filters: parseAsJson((value) => {
        const parsed = filtersSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
      sorting: parseAsJson((value) => {
        const parsed = sortingSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
      status: parseAsString.withDefault("all"),
    },
    { history: "replace" }
  );

  const tableState = useMemo(
    () => ({
      columnFilters: urlParams.filters,
      globalFilter: urlParams.search,
      pagination: {
        pageIndex: urlParams.page,
        pageSize: urlParams.pageSize,
      },
      rowSelection,
      sorting: urlParams.sorting,
    }),
    [rowSelection, urlParams]
  );

  // Fold the status tab (URL param, not a TanStack column filter) into the
  // single wire contract sent to the server.
  const serverFilters = useMemo(() => {
    const filters: Array<{ id: string; value: unknown }> = [
      ...urlParams.filters,
    ];

    if (urlParams.status !== "all") {
      filters.push({ id: "status", value: [urlParams.status] });
    }

    return filters;
  }, [urlParams]);

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
        return; // A newer request superseded this one.
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

  // Re-fetch when the server-side data changes and the page was refreshed via
  // revalidatePath/router.refresh (e.g. invoices were generated or voided).
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

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function"
          ? updater(tableState.pagination)
          : updater;
      setUrlParams({
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      });
    },
    [tableState.pagination, setUrlParams]
  );

  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === "function"
          ? updater(tableState.columnFilters)
          : updater;
      setUrlParams({ filters: newFilters, page: 0 });
    },
    [tableState.columnFilters, setUrlParams]
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(tableState.sorting) : updater;
      setUrlParams({ sorting: newSorting, page: 0 });
    },
    [tableState.sorting, setUrlParams]
  );

  const handleGlobalFilterChange = useCallback(
    (value: GlobalFilter) => {
      if (typeof value === "string") {
        setUrlParams({ search: value, page: 0 });
      }
    },
    [setUrlParams]
  );

  const handleRowSelectionChange = useCallback(
    (updater: Updater<RowSelectionState>) => {
      setRowSelection((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const handleRowClick = useCallback(
    (row: Invoice) => {
      onSelectInvoice(row);
    },
    [onSelectInvoice]
  );

  const handleStatusTabChange = useCallback(
    (value: string | null) => {
      setUrlParams({ status: value ?? "all", page: 0 });
    },
    [setUrlParams]
  );

  const getRowId = useCallback((row: Invoice) => row.id, []);

  const clearSelection = useCallback(() => {
    setRowSelection({});
    setSelectedInvoices([]);
  }, []);

  const handleVoidSelected = useCallback(
    async (formData: FormData) => {
      await voidInvoices(formData);
      router.refresh();
      clearSelection();
    },
    [clearSelection, router]
  );

  const formatMoney = useMemo(
    () => (amountSen: number) => formatMoneyShared(amountSen, { currency }),
    [currency]
  );
  const columns = useMemo(
    () => createColumns(formatMoney, onSelectInvoice),
    [formatMoney, onSelectInvoice]
  );

  return (
    <CardShell>
      <CardContent className="p-0">
        <DataTableRoot
          columns={columns}
          config={{
            enableRowSelection: true,
            manualPagination: true,
            manualSorting: true,
            enableSorting: true,
            manualFiltering: true,
            pageCount: Math.ceil(totalCount / urlParams.pageSize),
          }}
          data={data}
          getRowId={getRowId}
          initialState={{ columnVisibility: { billingMonth: false } }}
          isLoading={isLoading}
          onColumnFiltersChange={handleColumnFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onPaginationChange={handlePaginationChange}
          onRowSelection={setSelectedInvoices}
          onRowSelectionChange={handleRowSelectionChange}
          onSortingChange={handleSortingChange}
          state={tableState}
        >
          <div className="grid gap-4 p-4 pb-3">
            <DataTableToolbarSection>
              <DataTableSearchFilter placeholder="Search student, guardian, or invoice number..." />
              <DataTableFacetedFilter
                accessorKey="billingMonth"
                options={filterOptions.months}
                title="Month"
              />
              <DataTableClearFilter />
            </DataTableToolbarSection>
          </div>

          {/* Status tabs (mirrors the reference page's underline tabs). */}
          <Tabs
            className="border-b px-4 pt-1"
            onValueChange={handleStatusTabChange}
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
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2.5">
              <span className="font-semibold text-primary text-xs">
                {selectedInvoices.length} selected
              </span>
              <div className="h-4 w-px bg-border" />
              <form action={handleVoidSelected}>
                <input
                  name="invoiceIds"
                  type="hidden"
                  value={JSON.stringify(
                    selectedInvoices.map((invoice) => invoice.id)
                  )}
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
          )}

          <div className="overflow-x-auto px-4">
            <DataTable aria-label="Invoices">
              <DataTableHeader />
              <DataTableBody onRowClick={handleRowClick}>
                <DataTableSkeleton />
                <DataTableEmptyBody />
              </DataTableBody>
            </DataTable>
          </div>

          <div className="px-4 pb-4">
            <DataTablePagination totalCount={totalCount} />
          </div>
        </DataTableRoot>
      </CardContent>
    </CardShell>
  );
}
