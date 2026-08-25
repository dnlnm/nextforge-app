"use client";

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
import { Label } from "@repo/design-system/components/ui/label";
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
import { flexRender } from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
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

const FILTERS_SCHEMA = z.array(
  z.object({ id: z.string(), value: z.unknown() })
);

// Stable keys for the 5 skeleton rows.
const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

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
      dateFrom: parseAsString.withDefault(""),
      dateTo: parseAsString.withDefault(""),
    },
    { history: "replace" }
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / urlParams.pageSize));

  // Fold the status tab and date range (URL params, not column filters) into
  // the single wire contract sent to the server.
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
        variant: "multi-select",
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
    () => createColumns(formatMoney, { methods: filterOptions.methods }),
    [formatMoney, filterOptions.methods]
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
        return;
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

  // Re-fetch when the server-side data changes (e.g. a payment was recorded or
  // verified and the page was refreshed via revalidatePath/router.refresh).
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

  const handleRowClick = useCallback(
    (row: Payment) => {
      onSelectPayment(row);
    },
    [onSelectPayment]
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
            No payments found.
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <TableRow
        className="cursor-pointer"
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

        <div className="grid gap-4 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) =>
                  setUrlParams({ search: event.target.value, page: 0 })
                }
                placeholder="Search student, receipt, invoice, or reference..."
                type="search"
                value={urlParams.search}
              />
            </div>
            <table.FilterList />
            <table.SortList />
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
          </div>
        </div>

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
