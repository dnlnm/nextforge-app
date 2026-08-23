"use client";

import {
  Avatar,
  AvatarFallback,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { cn } from "@repo/design-system/lib/utils";
import type { AttendanceStatus } from "@repo/schemas/enums";
import {
  Check,
  CheckSquare,
  Clock,
  FileText,
  Save,
  Search,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { SessionStudentView, SessionView } from "./types";

interface StatusOption {
  active: string;
  dot: string;
  icon: typeof Check;
  label: string;
  pill: string;
  rowTint: string;
  short: string;
  value: AttendanceStatus;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "PRESENT",
    label: "Present",
    short: "P",
    icon: Check,
    active:
      "border-transparent bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500 text-white",
    rowTint: "bg-emerald-500/[0.04]",
  },
  {
    value: "LATE",
    label: "Late",
    short: "L",
    icon: Clock,
    active:
      "border-transparent bg-amber-400 text-white shadow-sm ring-2 ring-amber-400 ring-offset-1",
    dot: "bg-amber-400",
    pill: "bg-amber-400 text-white",
    rowTint: "bg-amber-400/10",
  },
  {
    value: "ABSENT",
    label: "Absent",
    short: "A",
    icon: X,
    active:
      "border-transparent bg-rose-500 text-white shadow-sm ring-2 ring-rose-500 ring-offset-1",
    dot: "bg-rose-500",
    pill: "bg-rose-500 text-white",
    rowTint: "bg-rose-500/[0.04]",
  },
  {
    value: "EXCUSED",
    label: "Excused / MC",
    short: "EX",
    icon: FileText,
    active:
      "border-transparent bg-blue-500 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1",
    dot: "bg-blue-500",
    pill: "bg-blue-500 text-white",
    rowTint: "bg-blue-500/[0.06]",
  },
];

const statusConfig = (status: AttendanceStatus | null) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? null;

export const StatusPill = ({ status }: { status: AttendanceStatus | null }) => {
  const config = statusConfig(status);
  const Icon = config?.icon;

  if (!(config && Icon)) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 font-semibold text-muted-foreground text-xs">
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-xs",
        config.pill
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {config.short}
    </span>
  );
};

const accentForStatus = (status: AttendanceStatus | null): string => {
  switch (status) {
    case "PRESENT":
      return "border-l-emerald-500";
    case "LATE":
      return "border-l-amber-400";
    case "ABSENT":
      return "border-l-rose-500";
    case "EXCUSED":
      return "border-l-blue-500";
    default:
      return "border-l-transparent";
  }
};

const AttendRow = ({
  canMark,
  noteOpen,
  onToggleNote,
  onUpdateNote,
  onUpdateStatus,
  saved,
  student,
}: {
  canMark: boolean;
  noteOpen: boolean;
  onToggleNote: () => void;
  onUpdateNote: (note: string) => void;
  onUpdateStatus: (status: AttendanceStatus | null) => void;
  saved: boolean;
  student: SessionStudentView;
}) => {
  const editable = canMark && !saved;
  const config = statusConfig(student.status);

  return (
    <div
      className={cn(
        "border-border border-b border-l-2 pl-px transition-colors last:border-b-0",
        accentForStatus(student.status),
        config && !saved && config.rowTint
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {student.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground text-sm">
            {student.name}
          </p>
          {student.note && !noteOpen ? (
            <p className="flex items-center gap-1 truncate text-muted-foreground text-xs">
              <FileText className="size-3 shrink-0" />
              {student.note}
            </p>
          ) : null}
        </div>

        {editable ? (
          <div className="flex shrink-0 items-center gap-1">
            {STATUS_OPTIONS.map((option) => {
              const active = student.status === option.value;
              const Icon = option.icon;

              return (
                <button
                  aria-label={`${option.label} — ${student.name}`}
                  aria-pressed={active}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border font-bold text-[11px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    active
                      ? option.active
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/80"
                  )}
                  key={option.value}
                  onClick={() => onUpdateStatus(active ? null : option.value)}
                  title={`${option.label} — click again to clear`}
                  type="button"
                >
                  {option.short === "EX" ? (
                    <span className="text-[10px] leading-none">EX</span>
                  ) : (
                    <Icon className="size-3.5" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
            <button
              aria-label={`Add note for ${student.name}`}
              aria-pressed={noteOpen}
              className={cn(
                "ml-1 flex size-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                student.note || noteOpen
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
              onClick={onToggleNote}
              title="Add note"
              type="button"
            >
              <FileText className="size-3.5" />
            </button>
          </div>
        ) : (
          <StatusPill status={student.status} />
        )}
      </div>

      {noteOpen && editable && (
        <div className="px-3 pb-3 sm:px-4">
          <Input
            autoFocus
            className="h-8 text-xs"
            nativeInput
            onChange={(event) => onUpdateNote(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onToggleNote();
              }
            }}
            placeholder="MC submitted, parent called ahead, arrived late..."
            value={student.note}
          />
        </div>
      )}
    </div>
  );
};

interface SessionPanelProps {
  canMark: boolean;
  onMarkAll: (status: AttendanceStatus) => void;
  onSave: () => void;
  onUpdateNote: (studentId: string, note: string) => void;
  onUpdateStatus: (studentId: string, status: AttendanceStatus | null) => void;
  saving: boolean;
  session: SessionView;
}

const panelRateColor = (rate: number): string => {
  if (rate >= 90) {
    return "text-emerald-600";
  }
  if (rate >= 70) {
    return "text-amber-600";
  }
  return "text-rose-600";
};

const RateBreakdown = ({
  absent,
  excused,
  late,
  present,
  rate,
  total,
  unmarked,
}: {
  absent: number;
  excused: number;
  late: number;
  present: number;
  rate: number;
  total: number;
  unmarked: number;
}) => (
  <div className="mt-4">
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        {present > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <span className="size-2 rounded-full bg-emerald-500" />
            {present} present
          </span>
        ) : null}
        {late > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <span className="size-2 rounded-full bg-amber-400" />
            {late} late
          </span>
        ) : null}
        {absent > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
            <span className="size-2 rounded-full bg-rose-500" />
            {absent} absent
          </span>
        ) : null}
        {excused > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
            <span className="size-2 rounded-full bg-blue-500" />
            {excused} MC
          </span>
        ) : null}
        {unmarked > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
            {unmarked} unmarked
          </span>
        ) : null}
      </div>
      <span className={cn("font-bold tabular-nums", panelRateColor(rate))}>
        {rate}%
      </span>
    </div>
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted p-0.5">
      {present > 0 ? (
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${(present / total) * 100}%` }}
        />
      ) : null}
      {late > 0 ? (
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${(late / total) * 100}%` }}
        />
      ) : null}
      {absent > 0 ? (
        <div
          className="h-full rounded-full bg-rose-500 transition-all"
          style={{ width: `${(absent / total) * 100}%` }}
        />
      ) : null}
      {excused > 0 ? (
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${(excused / total) * 100}%` }}
        />
      ) : null}
    </div>
  </div>
);

const MarkAllToolbar = ({
  onMarkAll,
  onSearchChange,
  search,
}: {
  onMarkAll: (status: AttendanceStatus) => void;
  onSearchChange: (value: string) => void;
  search: string;
}) => (
  <div className="flex flex-wrap items-center gap-2 border-border border-b bg-muted/10 px-3 py-2.5 sm:px-4">
    <div className="relative max-w-[220px] flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 pl-8 text-sm"
        nativeInput
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Find student…"
        value={search}
      />
    </div>
    <div className="ml-auto flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
      <span className="hidden sm:inline">Mark all:</span>
      <Button
        className="h-8 gap-1 px-2.5 text-xs hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
        onClick={() => onMarkAll("PRESENT")}
        size="sm"
        type="button"
        variant="outline"
      >
        <Check className="size-3.5" strokeWidth={3} />
        Present
      </Button>
      <Button
        className="h-8 gap-1 px-2.5 text-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        onClick={() => onMarkAll("ABSENT")}
        size="sm"
        type="button"
        variant="outline"
      >
        <X className="size-3.5" strokeWidth={3} />
        Absent
      </Button>
    </div>
  </div>
);

const PERF_HOLES = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"] as const;

const LedgerPerforation = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 left-0 flex w-[14px] flex-col items-center justify-around border-border/60 border-r border-dashed bg-muted/30 py-3"
  >
    {PERF_HOLES.map((id) => (
      <span
        className="size-[9px] shrink-0 rounded-full border border-border bg-background shadow-xs"
        key={id}
      />
    ))}
  </div>
);

const AttendanceTape = ({ students }: { students: SessionStudentView[] }) => {
  if (students.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-[14px] w-[3px] overflow-hidden"
    >
      <div className="flex h-full flex-col gap-px py-1">
        {students.map((student) => {
          let color = "bg-border";
          if (student.status === "PRESENT") {
            color = "bg-emerald-500";
          } else if (student.status === "LATE") {
            color = "bg-amber-400";
          } else if (student.status === "ABSENT") {
            color = "bg-rose-500";
          } else if (student.status === "EXCUSED") {
            color = "bg-blue-500";
          }
          return (
            <span
              className={cn("flex-1 rounded-full opacity-80", color)}
              key={student.id}
            />
          );
        })}
      </div>
    </div>
  );
};

export function SessionPanel({
  canMark,
  onMarkAll,
  onSave,
  onUpdateNote,
  onUpdateStatus,
  saving,
  session,
}: SessionPanelProps) {
  const [noteOpenFor, setNoteOpenFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const editable = canMark && !session.saved;

  const total = session.students.length;
  const present = session.students.filter((s) => s.status === "PRESENT").length;
  const late = session.students.filter((s) => s.status === "LATE").length;
  const absent = session.students.filter((s) => s.status === "ABSENT").length;
  const excused = session.students.filter((s) => s.status === "EXCUSED").length;
  const unmarked = session.students.filter((s) => !s.status).length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const filtered = session.students.filter(
    (student) =>
      !search || student.name.toLowerCase().includes(search.toLowerCase())
  );

  let headerAction: ReactNode;
  if (session.saved) {
    headerAction = (
      <Badge variant="success">
        <Check className="size-3.5" strokeWidth={3} />
        Saved
      </Badge>
    );
  } else if (editable && unmarked === 0) {
    headerAction = (
      <Button onClick={onSave} size="sm" type="button">
        <Save className="size-3.5" />
        Save Register
      </Button>
    );
  } else {
    headerAction = <Badge variant="secondary">Pending</Badge>;
  }

  return (
    <Card className="relative overflow-hidden pl-[14px]">
      <LedgerPerforation />
      <div className="relative">
        {/* subtle ledger paper wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_31px,var(--border)_32px)] opacity-[0.035] dark:opacity-[0.06]"
        />

        <div className="relative border-border border-b bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold text-foreground text-lg leading-none tracking-tight">
                  {session.className}
                </p>
                <span className="rounded bg-primary px-1.5 py-0.5 font-mono font-semibold text-[10px] text-primary-foreground uppercase tracking-widest">
                  Roll
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 font-medium text-muted-foreground">
                  <Clock className="size-3.5" />
                  {session.startsAt} – {session.endsAt}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 font-medium text-muted-foreground">
                  <FileText className="size-3.5" />
                  {session.grade}
                </span>
                {session.teacher ? (
                  <span className="text-muted-foreground text-xs">
                    {session.teacher}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerAction}
            </div>
          </div>

          <RateBreakdown
            absent={absent}
            excused={excused}
            late={late}
            present={present}
            rate={rate}
            total={total}
            unmarked={unmarked}
          />
        </div>

        {editable ? (
          <MarkAllToolbar
            onMarkAll={onMarkAll}
            onSearchChange={setSearch}
            search={search}
          />
        ) : null}

        <div className="relative">
          <AttendanceTape students={filtered} />
          <div className="ml-[3px]">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-muted-foreground text-sm">
                {search
                  ? "No students match your search."
                  : "No enrolled students."}
              </p>
            ) : (
              filtered.map((student) => (
                <AttendRow
                  canMark={canMark}
                  key={student.id}
                  noteOpen={noteOpenFor === student.id}
                  onToggleNote={() =>
                    setNoteOpenFor((current) =>
                      current === student.id ? null : student.id
                    )
                  }
                  onUpdateNote={(note) => onUpdateNote(student.id, note)}
                  onUpdateStatus={(status) =>
                    onUpdateStatus(student.id, status)
                  }
                  saved={session.saved}
                  student={student}
                />
              ))
            )}
          </div>
        </div>

        {editable && unmarked === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-border border-t bg-primary/[0.04] px-4 py-3">
            <p className="flex items-center gap-1.5 font-medium text-primary text-xs">
              <CheckSquare className="size-3.5" />
              All students marked — ready to save
            </p>
            <Button loading={saving} onClick={onSave} size="sm" type="button">
              <Save className="size-3.5" />
              Save Register
            </Button>
          </div>
        ) : null}

        {!editable && session.saved ? (
          <div className="flex items-center gap-2 border-border border-t bg-success/5 px-4 py-2.5 text-success-foreground text-xs">
            <Check className="size-3.5" />
            Register locked — saved and filed.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
