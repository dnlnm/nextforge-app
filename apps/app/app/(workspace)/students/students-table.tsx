"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  CardFrame,
  CardFrameFooter,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
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
  flexRender,
  getCoreRowModel,
  type Header,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react";
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTableMobileCards } from "../../../components/data-table-mobile-cards";
import type { StudentsQueryParams } from "./actions";
import { getStudentsForTable } from "./actions";
import { getStudentColumns, type Student } from "./columns";
import { StudentCard } from "./student-card";

interface StudentsTableProps {
  initialData: Student[];
  initialTotalCount: number;
  onRowClick?: (studentId: string) => void;
}

// Stable keys for the 5 skeleton rows (bodies use index-free keys).
const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

export function StudentsTable({
  initialData,
  initialTotalCount,
  onRowClick,
}: StudentsTableProps) {
  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const columns = useMemo(() => getStudentColumns(), []);

  // URL state: server-side pagination + sorting + debounced search.
  const [urlParams, setUrlParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(""),
      sorting: parseAsJson((value) => {
        const parsed = sortingSchema.safeParse(value);
        return parsed.success ? parsed.data : [];
      }).withDefault([] as SortingState),
    },
    { history: "replace" }
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / urlParams.pageSize));

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: {
      sorting: urlParams.sorting,
    },
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(urlParams.sorting) : updater;
      setUrlParams({ sorting: next, page: 0 });
    },
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

  const setPageIndex = (index: number) => {
    setUrlParams({ page: Math.max(0, Math.min(index, pageCount - 1)) });
  };

  const handleRowClick = (row: Student) => {
    onRowClick?.(row.id);
  };

  const rangeOptions = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, index) => {
        const start = index * urlParams.pageSize + 1;
        const end = Math.min((index + 1) * urlParams.pageSize, totalCount);
        return { label: `${start}-${end}`, value: index + 1 };
      }),
    [pageCount, totalCount, urlParams.pageSize]
  );

  const renderHeaderContent = (header: Header<Student, unknown>) => {
    if (header.isPlaceholder) {
      return null;
    }

    if (!header.column.getCanSort()) {
      return flexRender(header.column.columnDef.header, header.getContext());
    }

    const isSorted = header.column.getIsSorted();
    const sortIcons = {
      asc: (
        <ChevronUpIcon
          aria-hidden="true"
          className="size-4 shrink-0 opacity-80"
        />
      ),
      desc: (
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 opacity-80"
        />
      ),
    };
    const sortedIndicator = isSorted
      ? sortIcons[isSorted as keyof typeof sortIcons]
      : null;

    return (
      <button
        className="flex h-full w-full cursor-pointer select-none items-center justify-between gap-2 text-left"
        onClick={header.column.getToggleSortingHandler()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            header.column.getToggleSortingHandler()?.(event);
          }
        }}
        type="button"
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {sortedIndicator}
      </button>
    );
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
      <div className="grid gap-4 p-4">
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
                      {renderHeaderContent(header)}
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
        <div className="flex items-center justify-between gap-2">
          {/* Results range selector */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <p className="text-muted-foreground text-sm">Viewing</p>
            <Select
              items={rangeOptions}
              onValueChange={(value) => setPageIndex((value as number) - 1)}
              value={urlParams.page + 1}
            >
              <SelectTrigger
                aria-label="Select result range"
                className="w-fit min-w-none"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <p className="text-muted-foreground text-sm">
              of{" "}
              <strong className="font-medium text-foreground">
                {totalCount}
              </strong>{" "}
              results
            </p>
          </div>

          {/* Pagination */}
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={urlParams.page === 0}
                      onClick={() => setPageIndex(urlParams.page - 1)}
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={urlParams.page >= pageCount - 1}
                      onClick={() => setPageIndex(urlParams.page + 1)}
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardFrameFooter>
    </CardFrame>
  );
}
