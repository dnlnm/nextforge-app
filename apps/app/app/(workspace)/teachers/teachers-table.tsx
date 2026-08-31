"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import {
  type ExtendedColumnFilter,
  toFilterValueArray,
  useAppTable,
} from "@repo/design-system/components/ui/data-table/table";
import { Input } from "@repo/design-system/components/ui/input";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { sortingSchema } from "@repo/schemas/common";
import { flexRender } from "@tanstack/react-table";
import { RotateCcwIcon, SearchIcon } from "lucide-react";
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { DataTableMobileCards } from "../../../components/data-table-mobile-cards";
import type { TeachersQueryParams } from "./actions";
import { getTeachersForTable } from "./actions";
import { createColumns, type Teacher } from "./columns";
import { TeacherCard } from "./teacher-card";

interface TeachersTableProps {
  initialData: Teacher[];
  initialTotalCount: number;
  onRowClick?: (teacherId: string) => void;
}

const FILTERS_SCHEMA = z.array(
  z.object({ id: z.string(), value: z.unknown() })
);

// Stable keys for the 5 skeleton rows (bodies use index-free keys).
const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

export function TeachersTable({
  initialData,
  initialTotalCount,
  onRowClick,
}: TeachersTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const columns = useMemo(() => createColumns(), []);

  // URL state: server-side pagination + sorting + debounced search + filters.
  const [urlParams, setUrlParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(""),
      sorting: parseAsJson((value) => {
        const parsed = sortingSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
      filters: parseAsJson((value) => {
        const parsed = FILTERS_SCHEMA.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([] as Array<{ id: string; value: unknown }>),
    },
    { history: "replace" }
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / urlParams.pageSize));

  const hasActiveState =
    urlParams.search !== "" ||
    urlParams.filters.length > 0 ||
    urlParams.sorting.length > 0;

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

  // Debounce the search term before hitting the server.
  const [debouncedSearch, setDebouncedSearch] = useState(urlParams.search);

  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(urlParams.search),
      250
    );
    return () => window.clearTimeout(handle);
  }, [urlParams.search]);

  // A request id guards against out-of-order responses (newest wins).
  const requestIdRef = useRef(0);

  const fetchTeachers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const params: TeachersQueryParams = {
        page: urlParams.page,
        pageSize: urlParams.pageSize,
        search: debouncedSearch || undefined,
        sorting: urlParams.sorting.length > 0 ? urlParams.sorting : undefined,
        filters: urlParams.filters.length > 0 ? urlParams.filters : undefined,
      };

      const result = await getTeachersForTable(params);

      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, urlParams]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Re-fetch when the server-side data changes (e.g. a teacher was archived).
  const prevTotalCount = useRef(initialTotalCount);

  useEffect(() => {
    if (prevTotalCount.current !== initialTotalCount) {
      prevTotalCount.current = initialTotalCount;
      fetchTeachers();
    }
  }, [fetchTeachers, initialTotalCount]);

  const handleRowClick = (teacher: Teacher) => {
    onRowClick?.(teacher.id);
  };

  const renderBody = () => {
    if (isLoading) {
      return SKELETON_ROW_KEYS.map((key) => (
        <TableRow className="border-border" key={key}>
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
        <TableRow className="border-0">
          <TableCell className="h-24 text-center" colSpan={columns.length}>
            No teachers found.
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <TableRow
        className="cursor-pointer border-border last:border-0"
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
    <table.AppTable>
      <PreviewCard
        header={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) => setUrlParams({ search: event.target.value, page: 0 })}
                placeholder="Search teachers..."
                type="search"
                value={urlParams.search}
              />
            </div>
            <div className="flex items-center gap-2">
              {hasActiveState ? (
                <Button
                  className="[&_svg]:size-3"
                  onClick={() =>
                    setUrlParams({
                      filters: [],
                      page: 0,
                      search: "",
                      sorting: [],
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  <RotateCcwIcon aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
              <table.FilterList />
              <table.SortList />
            </div>
          </div>
        }
        footer={<table.Pagination />}
        stageClassName="flex-col items-stretch justify-start overflow-hidden p-0 sm:p-0"
      >
        <div className="hidden min-h-0 w-full overflow-x-auto md:block">
          <Table className="w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="border-border hover:bg-transparent" key={headerGroup.id}>
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
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>{renderBody()}</TableBody>
          </Table>
          <Separator className="bg-border/60" />
        </div>

        <div className="px-4 md:hidden">
          <DataTableMobileCards
            emptyLabel="No teachers found"
            getRowKey={(teacher) => teacher.id}
            isLoading={isLoading}
            items={data}
            renderCard={(teacher) => (
              <TeacherCard onRowClick={handleRowClick} teacher={teacher} />
            )}
          />
        </div>
      </PreviewCard>
    </table.AppTable>
  );
}
