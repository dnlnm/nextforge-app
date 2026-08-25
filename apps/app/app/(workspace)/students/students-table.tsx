"use client";

import {
  CardFrame,
  CardFrameFooter,
} from "@repo/design-system/components/ui/card";
import {
  type ExtendedColumnFilter,
  mapOperatorForServer,
  mapOperatorForUi,
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
import { sortingSchema } from "@repo/schemas/common";
import {
  type StudentTableFilter,
  studentTableFilterSchema,
} from "@repo/schemas/students";
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
import { DataTableMobileCards } from "../../../components/data-table-mobile-cards";
import type { StudentsQueryParams } from "./actions";
import { getStudentsForTable } from "./actions";
import { type FilterOption, getStudentColumns, type Student } from "./columns";
import { StudentCard } from "./student-card";

interface StudentsTableProps {
  genderOptions: FilterOption[];
  initialData: Student[];
  initialTotalCount: number;
  levelOptions: FilterOption[];
  onRowClick?: (studentId: string) => void;
}

// Stable keys for the 5 skeleton rows (bodies use index-free keys).
const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

export function StudentsTable({
  genderOptions,
  initialData,
  initialTotalCount,
  levelOptions,
  onRowClick,
}: StudentsTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const columns = useMemo(
    () => getStudentColumns({ genderOptions, levelOptions }),
    [genderOptions, levelOptions]
  );

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
        const parsed = z.array(studentTableFilterSchema).safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([] as StudentTableFilter[]),
    },
    { history: "replace" }
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / urlParams.pageSize));

  // Translate between the wire contract (StudentTableFilter, niko operator
  // names) and the UI filter state (ExtendedColumnFilter, v9 operator names).
  const serializeFilters = useCallback(
    (filters: ExtendedColumnFilter[]): StudentTableFilter[] =>
      filters
        .filter((filter) => filter.id)
        .map((filter) => ({
          id: filter.id,
          operator: mapOperatorForServer(filter.operator ?? "includesString"),
          value: (filter.value ?? "") as string | string[] | null,
          joinOperator: filter.joinOperator ?? "and",
          variant:
            columns.find((column) => column.id === filter.id)?.meta?.variant ??
            "text",
        })),
    [columns]
  );

  const hydrateFilters = useCallback(
    (filters: StudentTableFilter[]): ExtendedColumnFilter[] =>
      filters.map((filter, index) => ({
        id: filter.id,
        value: filter.value ?? "",
        operator: mapOperatorForUi(filter.operator ?? "ilike"),
        joinOperator: (filter.joinOperator ?? "and") as "and" | "or",
        variant: filter.variant,
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

  const fetchStudents = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const params: StudentsQueryParams = {
        page: urlParams.page,
        pageSize: urlParams.pageSize,
        search: debouncedSearch || undefined,
        sorting: urlParams.sorting.length > 0 ? urlParams.sorting : undefined,
        filters: urlParams.filters.length > 0 ? urlParams.filters : undefined,
      };

      const result = await getStudentsForTable(params);

      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(result.data);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, urlParams]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Re-fetch when the server-side data changes (e.g. a student was archived,
  // deleted, or the page was refreshed via revalidatePath).
  const prevTotalCount = useRef(initialTotalCount);

  useEffect(() => {
    if (prevTotalCount.current !== initialTotalCount) {
      prevTotalCount.current = initialTotalCount;
      fetchStudents();
    }
  }, [fetchStudents, initialTotalCount]);

  const handleRowClick = (student: Student) => {
    onRowClick?.(student.id);
  };

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
            No students found.
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
        <div className="grid gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) =>
                  setUrlParams({ search: event.target.value, page: 0 })
                }
                placeholder="Search students..."
                type="search"
                value={urlParams.search}
              />
            </div>
            <table.FilterList />
            <table.SortList />
          </div>
        </div>

        <div className="hidden overflow-x-auto px-4 md:block">
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

        <div className="px-4 md:hidden">
          <DataTableMobileCards
            emptyLabel="No students found"
            getRowKey={(student) => student.id}
            isLoading={isLoading}
            items={data}
            renderCard={(student) => (
              <StudentCard onRowClick={handleRowClick} student={student} />
            )}
          />
        </div>

        <CardFrameFooter className="p-2">
          <table.Pagination />
        </CardFrameFooter>
      </table.AppTable>
    </CardFrame>
  );
}
