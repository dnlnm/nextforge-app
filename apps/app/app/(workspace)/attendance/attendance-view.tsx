"use client";

import {
  formatLongDate,
  getMalaysiaWeekday,
  tryParseCalendarDate,
} from "@repo/date";
import {
  Avatar,
  AvatarFallback,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import { cn } from "@repo/design-system/lib/utils";
import type { AttendanceStatus } from "@repo/schemas/enums";
import {
  AlertTriangle,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  Percent,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { getSessionRoster, markAttendance } from "./actions";
import { SessionPanel, StatusPill } from "./session-panel";
import type {
  HistoryRowView,
  HistoryStatsView,
  SessionView,
  WeekDayView,
} from "./types";

type StatColor = "default" | "error" | "info" | "success" | "warning";

interface RosterStudent {
  id: string;
  name: string;
  note: string;
  status: AttendanceStatus | null;
}

const WEEKDAY_FULL: Record<string, string> = {
  FRIDAY: "Friday",
  MONDAY: "Monday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  THURSDAY: "Thursday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
};

const formatDaySubtitle = (iso: string): string => {
  const date = tryParseCalendarDate(iso);

  if (!date) {
    return "";
  }

  return `${WEEKDAY_FULL[getMalaysiaWeekday(date)] ?? ""}, ${formatLongDate(
    date,
    "en"
  )}`;
};

const KpiCard = ({
  color,
  icon: Icon,
  label,
  sub,
  value,
}: {
  color?: StatColor;
  icon: typeof Percent;
  label: string;
  sub: string;
  value: string | number;
}) => (
  <Stat>
    <StatPanel>
      <StatIndicator color={color} variant="icon">
        <Icon className="size-4" />
      </StatIndicator>
      <StatLabel>{label}</StatLabel>
      <StatValue>{value}</StatValue>
    </StatPanel>
    <StatFooter className="min-h-12 px-4 py-3">
      <StatDescription>{sub}</StatDescription>
    </StatFooter>
  </Stat>
);

const rateColor = (rate: number): string => {
  if (rate >= 90) {
    return "text-emerald-600";
  }
  if (rate >= 70) {
    return "text-amber-600";
  }
  return "text-rose-600";
};

const rateBg = (rate: number): string => {
  if (rate >= 90) {
    return "bg-emerald-500";
  }
  if (rate >= 70) {
    return "bg-amber-400";
  }
  return "bg-rose-500";
};

const WHITESPACE_RE = /\s+/;

const getInitials = (name: string): string =>
  name
    .split(WHITESPACE_RE)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const weekDayButtonClass = (day: WeekDayView, selectedDate: string): string => {
  if (day.isToday) {
    return "border-primary bg-primary text-primary-foreground shadow-sm";
  }
  if (selectedDate === day.date) {
    return "border-primary/30 bg-primary/10 text-primary";
  }
  return "border-border bg-card hover:border-primary/30 hover:bg-muted/50";
};

const weekDayDotClass = (day: WeekDayView): string => {
  if (day.isToday) {
    return "bg-white/70";
  }
  if (day.totalCount === 0) {
    return "bg-transparent";
  }
  if (day.savedCount >= day.totalCount) {
    return "bg-emerald-500";
  }
  return day.isPast ? "bg-rose-400" : "bg-amber-400";
};

const SessionListBadge = ({ session }: { session: SessionView }) => {
  const unmarked = session.students.filter((student) => !student.status).length;

  if (session.saved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-bold text-[10px] text-emerald-600">
        <CheckSquare className="size-3" />
        Done
      </span>
    );
  }
  if (unmarked > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-bold text-[10px] text-amber-600">
        {unmarked} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-bold text-[10px] text-primary">
      <CheckSquare className="size-3" />
      Ready
    </span>
  );
};

const LEGEND: Array<{ dot: string; label: string }> = [
  { dot: "bg-emerald-500", label: "Present" },
  { dot: "bg-amber-400", label: "Late" },
  { dot: "bg-rose-500", label: "Absent" },
  { dot: "bg-blue-500", label: "MC / Excused" },
  { dot: "bg-muted", label: "Unmarked" },
];

interface AttendanceViewProps {
  canMark: boolean;
  historyRows: HistoryRowView[];
  historyStats: HistoryStatsView;
  sessions: SessionView[];
  todayDate: string;
  weekDays: WeekDayView[];
}

export function AttendanceView({
  canMark,
  historyRows,
  historyStats,
  sessions,
  todayDate,
  weekDays,
}: AttendanceViewProps) {
  const router = useRouter();
  const [viewSessions, setViewSessions] = useState(sessions);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const [historySearch, setHistorySearch] = useState("");
  const [historyClass, setHistoryClass] = useState("All");
  const [rosterRow, setRosterRow] = useState<HistoryRowView | null>(null);
  const [rosterStudents, setRosterStudents] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const previousSessions = useRef(sessions);
  useEffect(() => {
    if (previousSessions.current !== sessions) {
      previousSessions.current = sessions;
      setViewSessions(sessions);
    }
  }, [sessions]);

  const daySessions = useMemo(
    () => viewSessions.filter((session) => session.date === selectedDate),
    [selectedDate, viewSessions]
  );
  const activeSession =
    daySessions.find((session) => session.id === activeSessionId) ??
    daySessions[0] ??
    null;

  const updateSession = (
    sessionId: string,
    updater: (session: SessionView) => SessionView
  ) => {
    setViewSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? updater(session) : session
      )
    );
  };

  const updateStatus = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus | null
  ) => {
    updateSession(sessionId, (session) => ({
      ...session,
      students: session.students.map((student) =>
        student.id === studentId ? { ...student, status } : student
      ),
    }));
  };

  const updateNote = (sessionId: string, studentId: string, note: string) => {
    updateSession(sessionId, (session) => ({
      ...session,
      students: session.students.map((student) =>
        student.id === studentId ? { ...student, note } : student
      ),
    }));
  };

  const markAll = (sessionId: string, status: AttendanceStatus) => {
    updateSession(sessionId, (session) => ({
      ...session,
      students: session.students.map((student) => ({ ...student, status })),
    }));
  };

  const handleSave = async (session: SessionView) => {
    if (!canMark || session.saved || savingId) {
      return;
    }

    setSavingId(session.id);
    try {
      const formData = new FormData();
      formData.set("sessionId", session.id);
      for (const student of session.students) {
        if (student.status) {
          formData.set(`status:${student.id}`, student.status);
        }
        if (student.note.trim()) {
          formData.set(`note:${student.id}`, student.note.trim());
        }
      }

      await markAttendance(formData);

      setViewSessions((current) =>
        current.map((item) =>
          item.id === session.id ? { ...item, saved: true } : item
        )
      );
      setActiveSessionId(
        daySessions.find((item) => item.id !== session.id && !item.saved)?.id ??
          null
      );
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to save register:", error);
    } finally {
      setSavingId(null);
    }
  };

  const allStudents = daySessions.flatMap((session) => session.students);
  const totalToday = allStudents.length;
  const presentToday = allStudents.filter(
    (student) => student.status === "PRESENT" || student.status === "LATE"
  ).length;
  const absentToday = allStudents.filter(
    (student) => student.status === "ABSENT"
  ).length;
  const unmarkedToday = allStudents.filter((student) => !student.status).length;
  const rateToday =
    totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
  const savedCount = daySessions.filter((session) => session.saved).length;

  const classOptions = useMemo(
    () => ["All", ...new Set(historyRows.map((row) => row.session))],
    [historyRows]
  );

  const filteredHistory = historyRows.filter((row) => {
    const classMatch = historyClass === "All" || row.session === historyClass;
    const searchMatch =
      !historySearch ||
      row.session.toLowerCase().includes(historySearch.toLowerCase()) ||
      row.grade.toLowerCase().includes(historySearch.toLowerCase()) ||
      row.date.toLowerCase().includes(historySearch.toLowerCase());

    return classMatch && searchMatch;
  });

  const openRoster = async (row: HistoryRowView) => {
    setRosterRow(row);
    setRosterStudents([]);
    setRosterLoading(true);
    try {
      setRosterStudents(await getSessionRoster(row.id));
    } catch (error) {
      console.error("Failed to load session roster:", error);
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <Tabs className="gap-4" defaultValue="today">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-semibold text-2xl tracking-tight">
            Attendance
          </h1>
          <p className="text-muted-foreground text-sm">
            {formatDaySubtitle(selectedDate)} · {savedCount}/
            {daySessions.length} sessions saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unmarkedToday > 0 ? (
            <Badge variant="warning">
              <AlertTriangle className="size-3.5" />
              {unmarkedToday} unmarked
            </Badge>
          ) : null}
          <TabsList>
            <TabsTab value="today">Today</TabsTab>
            <TabsTab value="history">History</TabsTab>
          </TabsList>
        </div>
      </div>

      <TabsContent className="flex-1" value="today">
        <div className="grid gap-5">
          {/* Week strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <p className="mr-1 shrink-0 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
              This week
            </p>
            {weekDays.map((day) => (
              <button
                className={cn(
                  "flex min-w-14 shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-all",
                  weekDayButtonClass(day, selectedDate)
                )}
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <span
                  className={cn(
                    "font-semibold text-[10px] uppercase",
                    day.isToday
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </span>
                <span
                  className={cn(
                    "font-bold text-sm",
                    day.isToday && "text-primary-foreground"
                  )}
                >
                  {day.day}
                </span>
                <span
                  className={cn("size-1.5 rounded-full", weekDayDotClass(day))}
                />
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              color="default"
              icon={Percent}
              label="Attendance Rate"
              sub="Present + late today"
              value={`${rateToday}%`}
            />
            <KpiCard
              color="success"
              icon={Users}
              label="Present Today"
              sub={`of ${totalToday} students`}
              value={presentToday}
            />
            <KpiCard
              color="error"
              icon={AlertTriangle}
              label="Absent"
              sub="Including excused / MC"
              value={absentToday}
            />
            <KpiCard
              color="info"
              icon={CheckSquare}
              label="Sessions"
              sub="Registers saved"
              value={`${savedCount}/${daySessions.length}`}
            />
          </div>

          {/* Session list + panel */}
          <div className="grid items-start gap-4 xl:grid-cols-[280px_1fr]">
            <Card className="overflow-hidden">
              <div className="border-border border-b bg-muted/20 px-4 py-3">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                  Today&apos;s Sessions
                </p>
              </div>
              {daySessions.length === 0 ? (
                <p className="px-4 py-6 text-center text-muted-foreground text-sm">
                  No sessions for this day.
                </p>
              ) : (
                daySessions.map((session) => {
                  const sTotal = session.students.length;
                  const sPresent = session.students.filter(
                    (student) =>
                      student.status === "PRESENT" || student.status === "LATE"
                  ).length;
                  const sRate =
                    sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 0;
                  const isActive = activeSession?.id === session.id;

                  return (
                    <button
                      className={cn(
                        "w-full border-border border-b text-left transition-colors last:border-0",
                        isActive
                          ? "border-l-2 border-l-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      )}
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      type="button"
                    >
                      <div className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "truncate font-semibold text-sm",
                                isActive ? "text-primary" : "text-foreground"
                              )}
                            >
                              {session.grade}
                            </p>
                            <p className="mt-0.5 truncate text-muted-foreground text-xs">
                              {session.className}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                              <Clock className="size-3" />
                              {session.startsAt}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <SessionListBadge session={session} />
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {sTotal} students
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              rateBg(sRate)
                            )}
                            style={{ width: `${sRate}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </Card>

            {activeSession ? (
              <SessionPanel
                canMark={canMark}
                onMarkAll={(status) => markAll(activeSession.id, status)}
                onSave={() => handleSave(activeSession)}
                onUpdateNote={(studentId, note) =>
                  updateNote(activeSession.id, studentId, note)
                }
                onUpdateStatus={(studentId, status) =>
                  updateStatus(activeSession.id, studentId, status)
                }
                saving={savingId === activeSession.id}
                session={activeSession}
              />
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No sessions for this day</EmptyTitle>
                  <EmptyDescription>
                    {selectedDate === todayDate
                      ? "Create today&apos;s sessions from the Today page if classes are scheduled, then mark attendance here."
                      : "There are no classes scheduled for this day."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
            <span className="font-semibold">Status legend:</span>
            {LEGEND.map((item) => (
              <span className="flex items-center gap-1.5" key={item.label}>
                <span className={cn("size-2 rounded-full", item.dot)} />
                {item.label}
              </span>
            ))}
            {canMark ? (
              <span className="ml-auto text-[11px]">
                Click a status button to mark · click again to unmark
              </span>
            ) : null}
          </div>
        </div>
      </TabsContent>

      <TabsContent className="flex-1" value="history">
        <div className="grid gap-5">
          {/* History KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              color="default"
              icon={Percent}
              label={`Avg Rate (${historyStats.monthLabel})`}
              sub="Present + late"
              value={`${historyStats.avgRate}%`}
            />
            <KpiCard
              color="info"
              icon={BookOpen}
              label="Total Sessions"
              sub={historyStats.monthLabel}
              value={historyStats.totalSessions}
            />
            <KpiCard
              color="success"
              icon={TrendingUp}
              label="Perfect Days"
              sub="100% attendance days"
              value={historyStats.perfectDays}
            />
            <KpiCard
              color="error"
              icon={AlertTriangle}
              label="Absent Events"
              sub="Across saved registers"
              value={historyStats.absentEvents}
            />
          </div>

          {/* Filter bar */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center gap-3 border-border border-b p-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    nativeInput
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Search session or class..."
                    value={historySearch}
                  />
                </div>
                <Select
                  onValueChange={(value) => setHistoryClass(value ?? "All")}
                  value={historyClass}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredHistory.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No registers yet</EmptyTitle>
                    <EmptyDescription>
                      Saved attendance registers for this month will appear
                      here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table variant="card">
                  <TableHeader>
                    <TableRow>
                      {[
                        "Date",
                        "Session",
                        "Grade",
                        "Total",
                        "Present",
                        "Late",
                        "Absent",
                        "Rate",
                        "",
                      ].map((header) => (
                        <TableHead
                          className="bg-muted/30 px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider"
                          key={header}
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="px-4 py-3 font-medium text-foreground text-sm">
                          {row.date}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-foreground text-sm">
                          {row.session}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                            {row.grade}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-sm">
                          {row.total}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-semibold text-emerald-600 text-xs">
                          {row.present}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-semibold text-amber-600 text-xs">
                          {row.late || "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "px-4 py-3 font-semibold text-xs",
                            row.absent > 0
                              ? "text-rose-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {row.absent || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  rateBg(row.rate)
                                )}
                                style={{ width: `${row.rate}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "font-bold text-xs",
                                rateColor(row.rate)
                              )}
                            >
                              {row.rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Button
                            className="h-8 px-2.5 text-xs"
                            onClick={() => openRoster(row)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            View <ChevronRight className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Session roster dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRosterRow(null);
          }
        }}
        open={rosterRow !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rosterRow?.session ?? "Session"}</DialogTitle>
            <DialogDescription>
              {rosterRow ? `${rosterRow.date} · ${rosterRow.grade}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-3">
            {rosterLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-6" />
              </div>
            ) : null}
            {!rosterLoading && rosterStudents.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No enrolled students.
              </p>
            ) : null}
            {!rosterLoading && rosterStudents.length > 0
              ? rosterStudents.map((student) => (
                  <div
                    className="flex items-center gap-3 border-border border-b pb-3 last:border-b-0 last:pb-0"
                    key={student.id}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-muted-foreground">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground text-sm">
                        {student.name}
                      </p>
                      {student.note ? (
                        <p className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                          <FileText className="size-3 shrink-0" />
                          {student.note}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill status={student.status} />
                  </div>
                ))
              : null}
          </DialogPanel>
          {isRefreshing ? (
            <div className="flex items-center gap-2 px-6 pb-4 text-muted-foreground text-xs">
              <Spinner className="size-3.5" />
              Refreshing…
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
