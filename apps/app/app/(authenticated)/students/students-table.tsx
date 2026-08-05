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
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import type { StudentsQueryParams } from "./actions";
import { getStudentsForTable } from "./actions";
import { columns, type Student } from "./columns";

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
  levelOptions: FilterOption[];
  onRowClick?: (studentId: string) => void;
};

export function StudentsTable({
  initialData,
  initialTotalCount,
  classOptions,
  tutorOptions,
  statusOptions,
  levelOptions,
  onRowClick,
}: StudentsTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  // URL state management
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

  // Derive table state from URL
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

  // Fetch data when URL params change
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: StudentsQueryParams = {
        page: urlParams.page,
        pageSize: urlParams.pageSize,
        search: urlParams.search || undefined,
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
  }, [urlParams]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Re-fetch when the server-side data changes (e.g. a student was archived
  // or deleted and the page was refreshed via revalidatePath).
  const prevTotalCount = useRef(initialTotalCount);

  useEffect(() => {
    if (prevTotalCount.current !== initialTotalCount) {
      prevTotalCount.current = initialTotalCount;
      fetchStudents();
    }
  }, [fetchStudents, initialTotalCount]);

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
              <DataTableSearchFilter placeholder="Search students..." />
              <DataTableFacetedFilter
                accessorKey="class"
                multiple
                options={classOptions}
                title="Class"
              />
              <DataTableFacetedFilter
                accessorKey="tutor"
                multiple
                options={tutorOptions}
                title="Tutor"
              />
              <DataTableFacetedFilter
                accessorKey="status"
                multiple
                options={statusOptions}
                title="Status"
              />
              <DataTableFacetedFilter
                accessorKey="academicLevel"
                multiple
                options={levelOptions}
                title="Level"
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
