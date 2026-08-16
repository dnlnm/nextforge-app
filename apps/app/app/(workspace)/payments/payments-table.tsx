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
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import { formatMoney as formatMoneyShared } from "@repo/money";
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import type { PaymentsQueryParams } from "./actions";
import { getPaymentsForTable } from "./actions";
import { createColumns, type Payment } from "./columns";

interface FilterOption {
  label: string;
  value: string;
}

type StatusTab = "all" | "RECORDED" | "VERIFIED" | "REVERSED";

interface PaymentsTableProps {
  currency: string;
  filterOptions: { methods: FilterOption[] };
  initialData: Payment[];
  initialTotalCount: number;
  onSelectPayment: (payment: Payment) => void;
  statusCounts: Partial<Record<StatusTab, number>> & { all?: number };
}

const STATUS_TABS: Array<{ value: StatusTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "RECORDED", label: "Recorded" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REVERSED", label: "Reversed" },
];

export function PaymentsTable({
  currency,
  filterOptions,
  initialData,
  initialTotalCount,
  onSelectPayment,
  statusCounts,
}: PaymentsTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

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
      dateFrom: parseAsString.withDefault(""),
      dateTo: parseAsString.withDefault(""),
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
      sorting: urlParams.sorting,
    }),
    [urlParams]
  );

  // Fold the status tab and date range (URL params, not TanStack column
  // filters) into the single wire contract sent to the server.
  const serverFilters = useMemo(() => {
    const filters: Array<{ id: string; value: unknown }> = [
      ...urlParams.filters,
    ];

    if (urlParams.status !== "all") {
      filters.push({ id: "status", value: [urlParams.status] });
    }

    if (urlParams.dateFrom || urlParams.dateTo) {
      filters.push({
        id: "date",
        value: {
          from: urlParams.dateFrom || undefined,
          to: urlParams.dateTo || undefined,
        },
      });
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

  const fetchPayments = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const params: PaymentsQueryParams = {
        page: urlParams.page,
        pageSize: urlParams.pageSize,
        search: debouncedSearch || undefined,
        filters: serverFilters.length > 0 ? serverFilters : undefined,
        sorting: urlParams.sorting.length > 0 ? urlParams.sorting : undefined,
      };

      const result = await getPaymentsForTable(params);

      if (requestId !== requestIdRef.current) {
        return; // A newer request superseded this one.
      }
      setData(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, serverFilters, urlParams]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Re-fetch when the server-side data changes and the page was refreshed via
  // revalidatePath/router.refresh (e.g. a payment was recorded or verified).
  const prevInitial = useRef({ data: initialData, total: initialTotalCount });

  useEffect(() => {
    if (
      prevInitial.current.data !== initialData ||
      prevInitial.current.total !== initialTotalCount
    ) {
      prevInitial.current = { data: initialData, total: initialTotalCount };
      fetchPayments();
    }
  }, [fetchPayments, initialData, initialTotalCount]);

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

  const handleRowClick = useCallback(
    (row: Payment) => {
      onSelectPayment(row);
    },
    [onSelectPayment]
  );

  const handleStatusTabChange = useCallback(
    (value: string | null) => {
      setUrlParams({ status: value ?? "all", page: 0 });
    },
    [setUrlParams]
  );

  const formatMoney = useMoneyFormatter(currency);
  const columns = useMemo(() => createColumns(formatMoney), [formatMoney]);

  return (
    <Card>
      <CardContent className="p-0">
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

        <DataTableRoot
          columns={columns}
          config={{
            manualPagination: true,
            manualSorting: true,
            enableSorting: true,
            manualFiltering: true,
            pageCount: Math.ceil(totalCount / urlParams.pageSize),
          }}
          data={data}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          onColumnFiltersChange={handleColumnFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          state={tableState}
        >
          <div className="grid gap-4 p-4">
            <DataTableToolbarSection>
              <DataTableSearchFilter placeholder="Search student, receipt, invoice, or reference..." />
              <DataTableFacetedFilter
                accessorKey="method"
                multiple
                options={filterOptions.methods}
                title="Method"
              />
              <DateRangeFilter
                dateFrom={urlParams.dateFrom}
                dateTo={urlParams.dateTo}
                onDateFromChange={(value) =>
                  setUrlParams({ dateFrom: value, page: 0 })
                }
                onDateToChange={(value) =>
                  setUrlParams({ dateTo: value, page: 0 })
                }
              />
              <DataTableClearFilter />
            </DataTableToolbarSection>
          </div>

          <div className="overflow-x-auto px-4">
            <DataTable aria-label="Payments">
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
    </Card>
  );
}

function useMoneyFormatter(currency: string) {
  return useMemo(
    () => (amountSen: number) => formatMoneyShared(amountSen, { currency }),
    [currency]
  );
}

function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="date-from">
          From
        </Label>
        <Input
          className="h-9 w-[9.5rem]"
          id="date-from"
          onChange={(event) => onDateFromChange(event.target.value)}
          type="date"
          value={dateFrom}
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="date-to">
          To
        </Label>
        <Input
          className="h-9 w-[9.5rem]"
          id="date-to"
          onChange={(event) => onDateToChange(event.target.value)}
          type="date"
          value={dateTo}
        />
      </div>
    </div>
  );
}
