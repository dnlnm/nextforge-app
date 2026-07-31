"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQueryStates, parseAsInteger, parseAsString, parseAsJson } from "nuqs";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import type { GlobalFilter } from "@repo/design-system/components/niko-table/types";
import { z } from "zod";

import { DataTableRoot } from "@repo/design-system/components/niko-table/core/data-table-root";
import { DataTable } from "@repo/design-system/components/niko-table/core/data-table";
import {
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
  DataTableEmptyBody,
} from "@repo/design-system/components/niko-table/core/data-table-structure";
import { DataTableToolbarSection } from "@repo/design-system/components/niko-table/components/data-table-toolbar-section";
import { DataTableSearchFilter } from "@repo/design-system/components/niko-table/components/data-table-search-filter";
import { DataTableFacetedFilter } from "@repo/design-system/components/niko-table/components/data-table-faceted-filter";
import { DataTableFilterMenu } from "@repo/design-system/components/niko-table/components/data-table-filter-menu";
import { DataTableClearFilter } from "@repo/design-system/components/niko-table/components/data-table-clear-filter";
import { DataTablePagination } from "@repo/design-system/components/niko-table/components/data-table-pagination";
import { Card, CardContent } from "@repo/design-system/components/ui/card";

import { columns, type Student } from "./columns";
import { getStudentsForTable } from "./actions";
import type { StudentsQueryParams } from "./actions";

type FilterOption = {
  label: string;
  value: string;
};

type StudentsTableProps = {
  initialData: Student[];
  initialTotalCount: number;
  classOptions: FilterOption[];
  tutorOptions: FilterOption[];
  statusOptions: FilterOption[];
  onRowClick?: (studentId: string) => void;
};

export function StudentsTable({
  initialData,
  initialTotalCount,
  classOptions,
  tutorOptions,
  statusOptions,
  onRowClick,
}: StudentsTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  // URL state management
  const sortSchema = z.array(z.object({ id: z.string(), desc: z.boolean() }));
  const filtersSchema = z.array(
    z.object({ id: z.string(), value: z.unknown() })
  );

  const [urlParams, setUrlParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(""),
      sort: parseAsJson((value) => {
        const parsed = sortSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
      filters: parseAsJson((value) => {
        const parsed = filtersSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([]),
    },
    { history: "replace" }
  );

  // Derive table state from URL
  const tableState = useMemo(
    () => ({
      pagination: {
        pageIndex: urlParams.page,
        pageSize: urlParams.pageSize,
      },
      sorting: urlParams.sort,
      columnFilters: urlParams.filters,
      globalFilter: urlParams.search,
    }),
    [urlParams]
  );

  // Fetch data when URL params change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: StudentsQueryParams = {
          page: urlParams.page,
          pageSize: urlParams.pageSize,
          search: urlParams.search || undefined,
          sorting: urlParams.sort.length > 0 ? urlParams.sort : undefined,
          filters: urlParams.filters.length > 0 ? urlParams.filters : undefined,
        };

        const result = await getStudentsForTable(params);
        setData(result.data);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [urlParams]);

  // State update handlers
  const handlePaginationChange = useCallback(
    (updater: any) => {
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

  const handleSortingChange = useCallback(
    (updater: any) => {
      const newSorting =
        typeof updater === "function" ? updater(tableState.sorting) : updater;
      setUrlParams({ sort: newSorting });
    },
    [tableState.sorting, setUrlParams]
  );

  const handleColumnFiltersChange = useCallback(
    (updater: any) => {
      const newFilters =
        typeof updater === "function"
          ? updater(tableState.columnFilters)
          : updater;
      setUrlParams({ filters: newFilters, page: 0 }); // Reset to first page
    },
    [tableState.columnFilters, setUrlParams]
  );

  const handleGlobalFilterChange = useCallback(
    (value: GlobalFilter) => {
      if (typeof value === "string") {
        setUrlParams({ search: value, page: 0 }); // Reset to first page
      }
    },
    [setUrlParams]
  );

  const handleRowClick = useCallback(
    (row: Student) => {
      if (onRowClick) {
        onRowClick(row.id);
      }
    },
    [onRowClick]
  );

  return (
    <Card>
      <CardContent className="p-0">
          <DataTableRoot
            data={data}
            columns={columns}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            config={{
              manualPagination: true,
              manualSorting: true,
              manualFiltering: true,
              pageCount: Math.ceil(totalCount / urlParams.pageSize),
            }}
            state={tableState}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onColumnFiltersChange={handleColumnFiltersChange}
            onGlobalFilterChange={handleGlobalFilterChange}
          >
          <div className="grid gap-4 p-4">
            <DataTableToolbarSection>
              <DataTableSearchFilter placeholder="Search students..." />
              <DataTableFacetedFilter
                accessorKey="class"
                title="Class"
                options={classOptions}
                multiple
              />
              <DataTableFacetedFilter
                accessorKey="tutor"
                title="Tutor"
                options={tutorOptions}
                multiple
              />
              <DataTableFacetedFilter
                accessorKey="status"
                title="Status"
                options={statusOptions}
                multiple
              />
              <DataTableFilterMenu />
              <DataTableClearFilter />
            </DataTableToolbarSection>
          </div>

          <div className="overflow-x-auto px-4">
            <DataTable>
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
