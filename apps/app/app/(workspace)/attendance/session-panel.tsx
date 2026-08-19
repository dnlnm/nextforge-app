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
    rowTint: "bg-emerald-500/5",
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
    rowTint: "bg-rose-500/5",
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
    rowTint: "bg-blue-500/10",
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
        "border-border border-b transition-colors last:border-0",
        config && !saved && config.rowTint
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-muted-foreground">
            {student.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground text-sm">
            {student.name}
          </p>
        </div>

        {editable ? (
          <div className="flex shrink-0 items-center gap-1">
            {STATUS_OPTIONS.map((option) => {
              const active = student.status === option.value;
              const Icon = option.icon;

              return (
                <button
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border font-bold text-[11px] transition-all",
                    active
                      ? option.active
                      : "border-border bg-muted text-muted-foreground hover:border-primary/30 hover:bg-muted/80"
                  )}
                  key={option.value}
                  onClick={() => onUpdateStatus(active ? null : option.value)}
                  title={option.label}
                  type="button"
                >
                  {option.short === "A" ||
                  option.short === "L" ||
                  option.short === "P" ? (
                    <Icon className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    option.short
                  )}
                </button>
              );
            })}
            <button
              className={cn(
                "ml-1 flex size-8 items-center justify-center rounded-lg border transition-colors",
                student.note
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
              onClick={onToggleNote}
              title="Add note"
              type="button"
            >
              <FileText className="size-3" />
            </button>
          </div>
        ) : (
          <StatusPill status={student.status} />
        )}
      </div>

      {noteOpen && editable && (
        <div className="px-4 pb-3">
          <Input
            autoFocus
            className="h-8 text-xs"
            nativeInput
            onChange={(event) => onUpdateNote(event.target.value)}
            placeholder="e.g. MC submitted, parent called ahead, arrived late..."
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
      <div className="flex flex-wrap items-center gap-3">
        {present > 0 ? (
          <span className="font-semibold text-emerald-600">
            {present} present
          </span>
        ) : null}
        {late > 0 ? (
          <span className="font-semibold text-amber-600">{late} late</span>
        ) : null}
        {absent > 0 ? (
          <span className="font-semibold text-rose-600">{absent} absent</span>
        ) : null}
        {excused > 0 ? (
          <span className="font-semibold text-blue-600">{excused} MC</span>
        ) : null}
        {unmarked > 0 ? (
          <span className="text-muted-foreground">{unmarked} unmarked</span>
        ) : null}
      </div>
      <span className={cn("font-bold", panelRateColor(rate))}>{rate}%</span>
    </div>
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
      {present > 0 ? (
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${(present / total) * 100}%` }}
        />
      ) : null}
      {late > 0 ? (
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${(late / total) * 100}%` }}
        />
      ) : null}
      {absent > 0 ? (
        <div
          className="h-full bg-rose-500 transition-all"
          style={{ width: `${(absent / total) * 100}%` }}
        />
      ) : null}
      {excused > 0 ? (
        <div
          className="h-full bg-blue-500 transition-all"
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
  <div className="flex items-center gap-2 border-border border-b bg-muted/10 px-4 py-2.5">
    <div className="relative max-w-xs flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8"
        nativeInput
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search student..."
        size="sm"
        value={search}
      />
    </div>
    <div className="ml-auto flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
      <span className="hidden sm:inline">Mark all:</span>
      <Button
        className="h-8 gap-1 px-2.5 text-xs hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={() => onMarkAll("PRESENT")}
        size="sm"
        type="button"
        variant="outline"
      >
        <Check className="size-3.5" strokeWidth={3} />
        Present
      </Button>
      <Button
        className="h-8 gap-1 px-2.5 text-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
    <Card className="overflow-hidden">
      <div className="border-border border-b bg-muted/20 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-base text-foreground">
              {session.className}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="size-3.5" />
                {session.startsAt} – {session.endsAt}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
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
          <div className="flex shrink-0 items-center gap-2">{headerAction}</div>
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

      <div>
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-muted-foreground text-sm">
            No students match your search.
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
              onUpdateStatus={(status) => onUpdateStatus(student.id, status)}
              saved={session.saved}
              student={student}
            />
          ))
        )}
      </div>

      {editable && unmarked === 0 ? (
        <div className="flex items-center justify-between gap-3 border-border border-t bg-primary/5 px-4 py-3">
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
    </Card>
  );
}
