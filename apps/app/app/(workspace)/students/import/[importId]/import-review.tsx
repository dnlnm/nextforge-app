"use client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { cn } from "@repo/design-system/lib/utils";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
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
import {
  addStudentImportRow,
  deleteStudentImportRows,
  getStudentImportRows,
  updateStudentImportRow,
} from "../actions";
import type { ValidationIssue } from "../lib/validation";

type FieldKind = "text" | "select" | "date";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const RELATIONSHIP_OPTIONS = ["Father", "Mother", "Guardian", "Other"];

const SELECT_FIELDS = new Set([
  "Gender",
  "Guardian Relationship",
  "Academic Level",
]);
const DATE_FIELDS = new Set(["Date of Birth", "Enrolled Date"]);

const fieldKind = (column: string): FieldKind => {
  if (SELECT_FIELDS.has(column)) {
    return "select";
  }
  if (DATE_FIELDS.has(column)) {
    return "date";
  }
  return "text";
};

const CODE_LABELS: Record<string, string> = {
  DUPLICATE_IN_FILE: "Duplicate student",
  FORMULA_CELL: "Formula cell",
  INVALID_DATE: "Invalid date",
  INVALID_EMAIL: "Invalid email",
  INVALID_ENUM: "Invalid value",
  INVALID_FORMAT: "Invalid format",
  INVALID_PHONE: "Invalid phone",
  REQUIRED: "Required field",
  UNKNOWN: "Other error",
};

const codeLabel = (code: string) => CODE_LABELS[code] ?? code;

const withCurrent = (base: readonly string[], current: string): string[] =>
  current && !base.includes(current) ? [current, ...base] : [...base];

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

interface ImportRowModel {
  id: string;
  issues: ValidationIssue[];
  rawData: Record<string, string>;
  rowNumber: number;
  status: string;
}

interface RowsResponse {
  counts?: { all: number; valid: number; invalid: number };
  error?: string;
  errorCodes?: string[];
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

type ReviewTab = "all" | "valid" | "invalid";

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
          "-mx-1 inline-flex h-8 w-full min-w-28 max-w-64 items-center gap-1 rounded border px-1.5 text-left font-normal text-sm transition-colors",
          errors.length
            ? "border-destructive/30 bg-destructive/10 hover:bg-destructive/20"
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
  const [tab, setTab] = useState<ReviewTab>("all");
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [data, setData] = useState<RowsResponse>();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce search input before applying it to the query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    async (
      nextTab: ReviewTab,
      nextPage: number,
      nextSearch: string,
      nextErrorCode: string
    ) => {
      setLoading(true);
      const response = await getStudentImportRows({
        errorCode: nextErrorCode,
        importId,
        page: nextPage,
        search: nextSearch,
        tab: nextTab,
      });
      setData(response as RowsResponse);
      setLoading(false);
    },
    [importId]
  );

  useEffect(() => {
    load(tab, page, appliedSearch, errorCode);
  }, [appliedSearch, errorCode, load, page, tab]);

  const reload = useCallback(() => {
    load(tab, page, appliedSearch, errorCode);
    router.refresh();
  }, [appliedSearch, errorCode, load, page, router, tab]);

  const rows = data?.rows ?? [];
  const allPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAllPage = (checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const row of rows) {
        if (checked) {
          next.add(row.id);
        } else {
          next.delete(row.id);
        }
      }
      return next;
    });
  };
  const toggleRow = (rowId: string, checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  };

  const removeSelected = async () => {
    const rowIds = [...selected];
    const result = await deleteStudentImportRows({ importId, rowIds });
    if ("error" in result && result.error) {
      toastManager.add({ title: result.error, type: "error" });
      return;
    }
    setSelected(new Set());
    toastManager.add({
      title: `Removed ${rowIds.length} row(s) from this import.`,
      type: "success",
    });
    reload();
  };

  const [adding, startAdd] = useTransition();

  const addRow = () => {
    startAdd(async () => {
      const result = await addStudentImportRow({ importId });
      if ("error" in result && result.error) {
        toastManager.add({ title: result.error, type: "error" });
        return;
      }
      if ("rowNumber" in result && result.rowNumber) {
        setErrorCode("");
        setTab("all");
        setPage(0);
        setSearchInput(String(result.rowNumber));
        setAppliedSearch(String(result.rowNumber));
      }
    });
  };

  const summary = data?.summary;
  const counts = data?.counts ?? { all: 0, valid: 0, invalid: 0 };
  const pageCount = data?.pageCount ?? 1;

  const tabs: Array<{ key: ReviewTab; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "valid", label: "Valid", count: counts.valid },
    { key: "invalid", label: "Invalid", count: counts.invalid },
  ];

  const errorItems = (data?.errorCodes ?? []).map((code) => ({
    label: codeLabel(code),
    value: code,
  }));
  const selectItems: Record<string, string> = Object.fromEntries(
    errorItems.map((item) => [item.value, item.label])
  );

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
  let tableBody: ReactNode = messageRow("No rows match this view.");
  if (loading && !rows.length) {
    tableBody = messageRow("Loading rows...");
  } else if (rows.length) {
    tableBody = rows.map((row) => {
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
        <TableRow
          className={cn(selected.has(row.id) && "bg-accent/40")}
          key={row.id}
        >
          <TableCell>
            <Checkbox
              aria-label={`Select row ${row.rowNumber}`}
              checked={selected.has(row.id)}
              onCheckedChange={(checked) => toggleRow(row.id, !!checked)}
            />
          </TableCell>
          <TableCell className="tabular-nums">{row.rowNumber}</TableCell>
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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-muted p-0.5">
          {tabs.map((entry) => (
            <Button
              className="h-7 px-2.5"
              key={entry.key}
              onClick={() => {
                setTab(entry.key);
                setPage(0);
                setSelected(new Set());
              }}
              size="sm"
              variant={tab === entry.key ? "default" : "ghost"}
            >
              {entry.label} ({entry.count.toLocaleString()})
            </Button>
          ))}
        </div>
        <div className="relative min-w-44 flex-1 sm:max-w-xs">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search rows"
            value={searchInput}
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                aria-label="Delete selected rows"
                disabled={selected.size === 0}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <Trash2Icon className="size-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {selected.size.toLocaleString()} row(s)?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Removed rows will not be imported. This cannot be undone, but
                you can re-upload the workbook to restore them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                Cancel
              </AlertDialogClose>
              <AlertDialogClose onClick={removeSelected} render={<Button />}>
                Remove Rows
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          aria-label="Add a row"
          disabled={adding}
          onClick={addRow}
          size="icon-sm"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
        </Button>
        <Button
          aria-label="Download error report"
          disabled={counts.invalid === 0}
          render={
            // biome-ignore lint/a11y/useAnchorContent: icon-only control; the accessible name comes from the button's aria-label
            <a download href={`/students/import/${importId}/errors`} />
          }
          size="icon-sm"
          variant="ghost"
        >
          <DownloadIcon className="size-4" />
        </Button>
        {errorItems.length > 0 && (
          <Select
            items={{ ALL: "All errors", ...selectItems }}
            onValueChange={(next) => {
              setErrorCode(next === "ALL" || !next ? "" : next);
              setPage(0);
              setSelected(new Set());
            }}
            value={errorCode === "" ? "ALL" : errorCode}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Filter by error" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All errors</SelectItem>
              {errorItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-muted-foreground text-xs tabular-nums">
            {data?.total?.toLocaleString() ?? 0} rows · page{" "}
            {(data?.page ?? 0) + 1}/{pageCount}
          </span>
          <Button
            aria-label="Previous page"
            disabled={loading || (data?.page ?? 0) === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            size="icon-sm"
            variant="ghost"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Next page"
            disabled={loading || (data?.page ?? 0) + 1 >= pageCount}
            onClick={() => setPage((value) => value + 1)}
            size="icon-sm"
            variant="ghost"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            aria-label="Close review and return to import history"
            onClick={() => router.push("/students/import")}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
      {summary && summary.blockingRows > 0 && (
        <Alert variant="error">
          <AlertCircleIcon />
          <AlertTitle>
            {summary.blockingRows.toLocaleString()} row(s) need fixing
          </AlertTitle>
          <AlertDescription>
            Fix every highlighted cell or remove those rows to unlock the
            import.
          </AlertDescription>
        </Alert>
      )}
      {summary?.notes && (
        <Alert variant="info">
          <AlertDescription>{summary.notes}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={allPageSelected}
                  onCheckedChange={(checked) => toggleAllPage(!!checked)}
                />
              </TableHead>
              <TableHead className="w-12">#</TableHead>
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
