"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { cn } from "@repo/design-system/lib/utils";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { getStudentImportRows, updateStudentImportRow } from "../actions";
import type { ValidationIssue } from "../lib/validation";

type FieldKind = "text" | "select" | "date";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const RELATIONSHIP_OPTIONS = ["Father", "Mother", "Guardian", "Other"];

const fieldKind = (column: string): FieldKind => {
  if (column === "Gender") {
    return "select";
  }
  if (column === "Guardian Relationship") {
    return "select";
  }
  if (column === "Academic Level") {
    return "select";
  }
  if (column === "Date of Birth" || column === "Enrolled Date") {
    return "date";
  }
  return "text";
};

const optionsFor = (
  column: string,
  levelOptions: readonly string[],
  current: string
): string[] => {
  if (column === "Gender") {
    return withCurrent(GENDER_OPTIONS, current);
  }
  if (column === "Guardian Relationship") {
    return withCurrent(RELATIONSHIP_OPTIONS, current);
  }
  if (column === "Academic Level") {
    return withCurrent(levelOptions, current);
  }
  return [];
};

const withCurrent = (base: readonly string[], current: string): string[] =>
  current && !base.includes(current) ? [current, ...base] : [...base];

interface ImportRowModel {
  id: string;
  issues: ValidationIssue[];
  rawData: Record<string, string>;
  rowNumber: number;
  status: string;
}

interface RowsResponse {
  error?: string;
  ok?: true;
  page?: number;
  pageCount?: number;
  rows?: ImportRowModel[];
  summary?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    blockingRows: number;
    notes: string;
  };
  total?: number;
}

const statusStyles: Record<string, string> = {
  VALID: "border-emerald-300 text-emerald-700 dark:text-emerald-400",
  INVALID: "border-destructive text-destructive",
  DUPLICATE: "border-destructive text-destructive",
  FAILED: "border-destructive text-destructive",
};

const EditableCell = ({
  column,
  importId,
  levelOptions,
  onSaved,
  rowId,
  issues,
  value,
}: {
  column: string;
  importId: string;
  levelOptions: readonly string[];
  onSaved: () => void;
  rowId: string;
  issues: ValidationIssue[];
  value: string;
}) => {
  const kind = fieldKind(column);
  const errors = issues.filter((entry) => entry.severity === "error");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const cancelledRef = useRef(false);
  const committedRef = useRef(false);

  const save = (next: string) => {
    setEditing(false);
    if (next === value) {
      return;
    }
    startTransition(async () => {
      const result = await updateStudentImportRow({
        field: column,
        importId,
        rowId,
        value: next,
      });
      if ("error" in result && result.error) {
        toastManager.add({ title: result.error, type: "error" });
      }
      onSaved();
    });
  };

  const commitDraft = () => {
    if (committedRef.current || cancelledRef.current) {
      committedRef.current = false;
      cancelledRef.current = false;
      return;
    }
    save(draft);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      cancelledRef.current = true;
      setEditing(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      committedRef.current = true;
      save(draft);
    }
  };

  if (!editing) {
    return (
      <button
        aria-invalid={errors.length > 0}
        className={cn(
          "relative -mx-1 inline-flex h-8 w-full min-w-28 max-w-64 items-center gap-1 rounded border px-1.5 text-left font-normal text-sm transition-colors",
          errors.length
            ? "border-destructive bg-destructive/10 hover:bg-destructive/20"
            : "border-transparent hover:border-input hover:bg-accent/60",
          pending && "animate-pulse opacity-60"
        )}
        onClick={() => {
          cancelledRef.current = false;
          committedRef.current = false;
          setDraft(value);
          setEditing(true);
        }}
        title={
          errors.length
            ? errors.map((entry) => entry.message).join("\n")
            : "Click to edit"
        }
        type="button"
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || "Empty"}
        </span>
        {errors.length > 0 && (
          <>
            <AlertCircleIcon className="ml-auto size-3.5 shrink-0 text-destructive" />
            <span className="sr-only">
              {errors.map((entry) => entry.message).join(". ")}
            </span>
          </>
        )}
      </button>
    );
  }

  if (kind === "select") {
    const options = optionsFor(column, levelOptions, value);
    const items: Record<string, string> = Object.fromEntries(
      options.map((option) => [option, option])
    );
    return (
      <Select
        items={items}
        onValueChange={(next) => {
          committedRef.current = true;
          save(next ?? "");
        }}
        value={draft}
      >
        <SelectTrigger aria-label={`Edit ${column}`} autoFocus className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option || "Empty"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (kind === "date") {
    return (
      <Input
        aria-label={`Edit ${column}`}
        autoFocus
        className="h-8 bg-background"
        onBlur={() => {
          if (!(committedRef.current || cancelledRef.current)) {
            save(draft);
          }
          committedRef.current = false;
          cancelledRef.current = false;
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          if (event.target.value !== draft) {
            committedRef.current = true;
            save(event.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
        type="date"
        value={draft}
      />
    );
  }

  return (
    <Input
      aria-invalid={errors.length > 0}
      aria-label={`Edit ${column}`}
      autoFocus
      className="h-8 bg-background"
      onBlur={commitDraft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      value={draft}
    />
  );
};

export const ImportReview = ({
  importId,
  columnNames,
  levelOptions,
}: {
  importId: string;
  columnNames: readonly string[];
  levelOptions: readonly string[];
}) => {
  const router = useRouter();
  const [filter, setFilter] = useState<"errors" | "all">("errors");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<RowsResponse>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextFilter: "errors" | "all", nextPage: number) => {
      setLoading(true);
      const response = await getStudentImportRows({
        filter: nextFilter,
        importId,
        page: nextPage,
      });
      setData(response as RowsResponse);
      setLoading(false);
    },
    [importId]
  );

  useEffect(() => {
    load(filter, page);
  }, [filter, load, page]);

  const reload = () => {
    load(filter, page);
    router.refresh();
  };

  const summary = data?.summary;
  const pageCount = data?.pageCount ?? 1;
  const colSpan = columnNames.length + 2;
  const messageRow = (message: string) => (
    <TableRow>
      <TableCell
        className="h-24 text-center text-muted-foreground"
        colSpan={colSpan}
      >
        {message}
      </TableCell>
    </TableRow>
  );
  let tableBody: ReactNode = messageRow("No rows match this filter.");
  if (loading && !data?.rows?.length) {
    tableBody = messageRow("Loading rows...");
  } else if (data?.rows?.length) {
    tableBody = data.rows.map((row) => {
      const issuesByField = new Map<string, ValidationIssue[]>();
      for (const issue of row.issues) {
        const key = issue.field ?? "";
        const existing = issuesByField.get(key);
        if (existing) {
          existing.push(issue);
        } else {
          issuesByField.set(key, [issue]);
        }
      }
      return (
        <TableRow key={row.id}>
          <TableCell className="tabular-nums">{row.rowNumber}</TableCell>
          <TableCell>
            <Badge
              className={cn("capitalize", statusStyles[row.status] ?? "")}
              variant="outline"
            >
              {row.status.toLowerCase()}
            </Badge>
          </TableCell>
          {columnNames.map((column) => (
            <TableCell key={column}>
              <EditableCell
                column={column}
                importId={importId}
                issues={issuesByField.get(column) ?? []}
                levelOptions={levelOptions}
                onSaved={reload}
                rowId={row.id}
                value={row.rawData[column] ?? ""}
              />
            </TableCell>
          ))}
        </TableRow>
      );
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button
            onClick={() => {
              setFilter("errors");
              setPage(0);
            }}
            size="sm"
            variant={filter === "errors" ? "default" : "ghost"}
          >
            Errors only
          </Button>
          <Button
            onClick={() => {
              setFilter("all");
              setPage(0);
            }}
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
          >
            All rows
          </Button>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span className="tabular-nums">
            {data?.total?.toLocaleString() ?? 0} rows · page{" "}
            {(data?.page ?? 0) + 1} of {pageCount}
          </span>
          <Button
            aria-label="Previous page"
            disabled={loading || (data?.page ?? 0) === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Next page"
            disabled={loading || (data?.page ?? 0) + 1 >= pageCount}
            onClick={() => setPage((value) => value + 1)}
            size="icon-sm"
            variant="outline"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
      {summary && summary.blockingRows > 0 && (
        <p className="text-destructive text-sm">
          {summary.blockingRows.toLocaleString()} row(s) still have blocking
          errors. Fix every highlighted cell to unlock the import.
        </p>
      )}
      {summary?.notes && (
        <p className="text-muted-foreground text-sm">{summary.notes}</p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-16">Row</TableHead>
              <TableHead className="w-24">Status</TableHead>
              {columnNames.map((column) => (
                <TableHead className="min-w-36" key={column}>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </Table>
      </div>
    </div>
  );
};
