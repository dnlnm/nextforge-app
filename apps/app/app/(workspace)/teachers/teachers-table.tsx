"use client";

import { DataTableClearFilter } from "@repo/design-system/components/niko-table/components/data-table-clear-filter";
import { DataTableFacetedFilter } from "@repo/design-system/components/niko-table/components/data-table-faceted-filter";
import { DataTableFilterMenu } from "@repo/design-system/components/niko-table/components/data-table-filter-menu";
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
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { TeachersQueryParams } from "./actions";
import { getTeachersForTable } from "./actions";
import { columns, type Teacher } from "./columns";

interface FilterOption {
  label: string;
  value: string;
}

interface TeachersTableProps {
  branchOptions: FilterOption[];
  initialData: Teacher[];
  initialTotalCount: number;
  onRowClick?: (teacherId: string) => void;
  subjectOptions: FilterOption[];
}

export function TeachersTable({
  initialData,
  initialTotalCount,
  subjectOptions,
  branchOptions,
  onRowClick,
}: TeachersTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const filtersSchema = z.array(
    z.object({ id: z.string(), value: z.unknown() })
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
    },
    { history: "replace" }
  );

  const tableState = useMemo(
    () => ({
      pagination: {
        pageIndex: urlParams.page,
        pageSize: urlParams.pageSize,
      },
      columnFilters: urlParams.filters,
      globalFilter: urlParams.search,
    }),
    [urlParams]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: TeachersQueryParams = {
          page: urlParams.page,
          pageSize: urlParams.pageSize,
          search: urlParams.search || undefined,
          filters: urlParams.filters.length > 0 ? urlParams.filters : undefined,
        };

        const result = await getTeachersForTable(params);
        setData(result.data);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [urlParams]);

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

  const handleGlobalFilterChange = useCallback(
    (value: GlobalFilter) => {
      if (typeof value === "string") {
        setUrlParams({ search: value, page: 0 });
      }
    },
    [setUrlParams]
  );

  const handleRowClick = useCallback(
    (row: Teacher) => {
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
          columns={columns}
          config={{
            manualPagination: true,
            enableSorting: false,
            manualFiltering: true,
            pageCount: Math.ceil(totalCount / urlParams.pageSize),
          }}
          data={data}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          onColumnFiltersChange={handleColumnFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onPaginationChange={handlePaginationChange}
          state={tableState}
        >
          <div className="grid gap-4 p-4">
            <DataTableToolbarSection>
              <DataTableSearchFilter placeholder="Search teachers..." />
              <DataTableFacetedFilter
                accessorKey="subject"
                multiple
                options={subjectOptions}
                title="Subject"
              />
              <DataTableFacetedFilter
                accessorKey="branch"
                multiple
                options={branchOptions}
                title="Branch"
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
