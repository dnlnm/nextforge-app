"use client";

import { IlamyCalendar, useIlamyCalendarContext } from "@ilamy/calendar";
import type { CalendarEvent } from "@ilamy/calendar";
import { Button } from "@repo/design-system/components/ui/button";
import { FluidPanel } from "@repo/design-system/components/fluid-panel";
import {
  createAppColumnHelper,
  useAppTable,
} from "@repo/design-system/components/ui/data-table/table";
import type { ExtendedColumnFilter } from "@repo/design-system/components/ui/data-table/table";
import { TabItem, Tabs, TabsList } from "@repo/design-system/components/ui/fluid-tabs";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DataTableFilterList } from "@repo/design-system/components/ui/data-table/data-table-filter-list";

dayjs.extend(utc);
dayjs.extend(timezone);

const KL_TZ = "Asia/Kuala_Lumpur";

interface ScheduleBlock {
  readonly classId: string;
  readonly className: string;
  readonly code: string;
  readonly dayOfWeek: string;
  readonly endsAt: string;
  readonly levelId: string | null;
  readonly levelName: string | null;
  readonly roomId: string | null;
  readonly roomName: string | null;
  readonly startsAt: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly teacherId: string | null;
  readonly teacherName: string | null;
}

const DAY_NUM: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const colorFor = (subjectId: string) => {
  let h = 0;
  for (let i = 0; i < subjectId.length; i++) h = (h * 31 + subjectId.charCodeAt(i)) >>> 0;
  return CHART_COLORS[h % CHART_COLORS.length] ?? CHART_COLORS[0];
};

const parseHm = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
};

const selectFilterFn = (row: { getValue: (id: string) => unknown }, columnId: string, filterValue: unknown): boolean => {
  const rowVal = String(row.getValue(columnId) ?? "");
  const arr: string[] = Array.isArray(filterValue)
    ? (filterValue as string[])
    : filterValue != null && filterValue !== ""
      ? [String(filterValue)]
      : [];
  if (arr.length === 0) return true;
  return arr.includes(rowVal);
};

const getScheduleColumns = (filters: ScheduleCalendarProps["filters"]) => {
  const helper = createAppColumnHelper<ScheduleBlock>();
  return helper.columns([
    helper.accessor((row) => row.classId, {
      id: "classId",
      header: "Class",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Class",
        variant: "select",
        options: filters.classes.map((c) => ({ label: c.name, value: c.id })),
      },
    }),
    helper.accessor((row) => row.levelId ?? "", {
      id: "levelId",
      header: "Level",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Level",
        variant: "select",
        options: filters.levels.map((l) => ({ label: l.name, value: l.id })),
      },
    }),
    helper.accessor((row) => row.subjectId, {
      id: "subjectId",
      header: "Subject",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Subject",
        variant: "select",
        options: filters.subjects.map((s) => ({ label: s.name, value: s.id })),
      },
    }),
    helper.accessor((row) => row.teacherId ?? "", {
      id: "teacherId",
      header: "Teacher",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Teacher",
        variant: "select",
        options: filters.teachers.map((t) => ({ label: t.name, value: t.id })),
      },
    }),
    helper.accessor((row) => row.roomId ?? "", {
      id: "roomId",
      header: "Room",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Room",
        variant: "select",
        options: filters.rooms.map((r) => ({ label: r.name, value: r.id })),
      },
    }),
    helper.accessor("dayOfWeek", {
      id: "dayOfWeek",
      header: "Day",
      enableSorting: false,
      filterFn: selectFilterFn,
      meta: {
        label: "Day",
        variant: "select",
        options: [
          { label: "Monday", value: "MONDAY" },
          { label: "Tuesday", value: "TUESDAY" },
          { label: "Wednesday", value: "WEDNESDAY" },
          { label: "Thursday", value: "THURSDAY" },
          { label: "Friday", value: "FRIDAY" },
          { label: "Saturday", value: "SATURDAY" },
          { label: "Sunday", value: "SUNDAY" },
        ],
      },
    }),
    helper.accessor("code", {
      id: "code",
      header: "Code",
      enableSorting: false,
      meta: { label: "Code", variant: "text" },
    }),
  ]);
};

const scheduleBlocksToEvents = (blocks: ScheduleBlock[]): CalendarEvent[] => {
  const anchor = dayjs.tz(dayjs(), KL_TZ);
  const startDay = anchor.subtract(30, "day").startOf("day");
  const endDay = anchor.add(30, "day").endOf("day");
  const events: CalendarEvent[] = [];
  for (let d = startDay; d.isBefore(endDay) || d.isSame(endDay, "day"); d = d.add(1, "day")) {
    const dow = d.day();
    for (const b of blocks) {
      if (DAY_NUM[b.dayOfWeek] !== dow) continue;
      const { h: sh, m: sm } = parseHm(b.startsAt);
      const { h: eh, m: em } = parseHm(b.endsAt);
      const dateStr = d.format("YYYY-MM-DD");
      const start = dayjs.tz(`${dateStr} ${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`, KL_TZ);
      let end = dayjs.tz(`${dateStr} ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`, KL_TZ);
      if (!end.isAfter(start)) end = end.add(1, "day");
      events.push({
        id: `${b.classId}-${b.dayOfWeek}-${b.startsAt}-${dateStr}`,
        title: `${b.className} · ${b.subjectName}`,
        start,
        end,
        color: colorFor(b.subjectId),
        data: {
          classId: b.classId,
          code: b.code,
          roomName: b.roomName ?? "",
          teacherName: b.teacherName ?? "",
          subjectName: b.subjectName,
        },
      });
    }
  }
  return events;
};

interface ScheduleCalendarProps {
  readonly blocks: ScheduleBlock[];
  readonly filters: {
    readonly classes: Array<{ readonly id: string; readonly name: string }>;
    readonly levels: Array<{ readonly id: string; readonly name: string }>;
    readonly rooms: Array<{ readonly id: string; readonly name: string }>;
    readonly subjects: Array<{ readonly id: string; readonly name: string }>;
    readonly teachers: Array<{ readonly id: string; readonly name: string }>;
  };
}

function FilterButton() {
  return <DataTableFilterList />;
}

/** Header that portals the toolbar (calendar nav + view + filter) into the PreviewCard header. Filter is most-right. */
function UnifiedHeader({ portalEl }: { portalEl: HTMLDivElement | null }) {
  const { nextPeriod, prevPeriod, today, currentDate, view, setView, getViews, t } = useIlamyCalendarContext();
  const views = getViews();

  if (!portalEl) return null;

  return createPortal(
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 items-center rounded-lg border bg-background">
          <Button aria-label={t("previous")} className="h-full" onClick={prevPeriod} size="icon" variant="ghost">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button aria-label={t("next")} className="h-full" onClick={nextPeriod} size="icon" variant="ghost">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <Button onClick={today} size="default" variant="outline">
          {t("today")}
        </Button>
        <span className="min-w-0 truncate px-1 text-sm font-medium">
          {currentDate.tz(KL_TZ).format(view === "month" || view === "year" ? "MMMM YYYY" : "MMM D, YYYY")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as never)}>
          <TabsList>
            {views
              .filter((v) => v.name !== "year")
              .map((v) => (
                <TabItem key={v.name} label={v.label ?? v.name} value={v.name} />
              ))}
          </TabsList>
        </Tabs>
        <FilterButton />
      </div>
    </div>,
    portalEl
  );
}

export const ScheduleCalendar = ({ blocks, filters }: ScheduleCalendarProps) => {
  const router = useRouter();
  const [headerPortalEl, setHeaderPortalEl] = useState<HTMLDivElement | null>(null);

  const columns = useMemo(() => getScheduleColumns(filters), [filters]);
  const [columnFilters, setColumnFilters] = useState<ExtendedColumnFilter[]>([]);

  const table = useAppTable({
    columns,
    data: blocks,
    state: { columnFilters },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? (updater as (prev: ExtendedColumnFilter[]) => ExtendedColumnFilter[])(columnFilters) : updater;
      setColumnFilters(next);
    },
  });

  const filteredBlocks = useMemo(() => table.getRowModel().rows.map((r) => r.original), [table]);

  const events = useMemo(() => scheduleBlocksToEvents(filteredBlocks), [filteredBlocks]);

  return (
    <table.AppTable>
      <FluidPanel
        header={
          <div ref={setHeaderPortalEl} className="flex w-full items-center justify-between gap-2 min-h-9">
            {/* Content is portaled from UnifiedHeader (inside IlamyCalendar) so it has calendar + table context */}
            {!headerPortalEl ? (
              <div className="flex w-full items-center justify-between gap-2 opacity-60">
                <span className="text-sm text-muted-foreground">Loading toolbar…</span>
              </div>
            ) : null}
          </div>
        }
        stageClassName="flex flex-col !p-0 sm:!p-0 !shadow-none bg-transparent gap-0"
      >
        {blocks.length === 0 ? (
          <div className="w-full p-8 text-center text-muted-foreground text-sm">No schedules yet.</div>
        ) : filteredBlocks.length === 0 ? (
          <div className="w-full p-8 text-center text-muted-foreground text-sm">No schedules match your filters.</div>
        ) : null}
        {blocks.length > 0 && filteredBlocks.length === 0 ? null : (
          <div className="flex w-full flex-1 overflow-hidden [&_[data-calendar-viewport]]:!border-0 [&_[data-calendar-viewport]]:!rounded-none [&_[data-calendar-viewport]]:!shadow-none h-[720px]">
            <IlamyCalendar
              events={events}
              initialView="week"
              firstDayOfWeek="monday"
              timezone={KL_TZ}
              locale="en-MY"
              disableDragAndDrop
              disableCellClick
              hideExportButton
              dayMaxEvents={3}
              slotDuration={30}
              headerComponent={<UnifiedHeader portalEl={headerPortalEl} />}
              scrollTime="08:00"
              onEventClick={(ev) => {
                const classId = (ev.data as { classId?: string } | undefined)?.classId;
                if (classId) router.push(`/classes/${classId}`);
              }}
              renderEvent={(ev) => {
                const d = ev.data as { teacherName?: string; roomName?: string } | undefined;
                return (
                  <div className="truncate px-1 py-0.5 text-[11px] leading-tight">
                    <div className="truncate font-medium">{ev.title}</div>
                    {d?.roomName || d?.teacherName ? (
                      <div className="truncate opacity-80">{[d.roomName, d.teacherName].filter(Boolean).join(" · ")}</div>
                    ) : null}
                  </div>
                );
              }}
            />
          </div>
        )}
        {filteredBlocks.length > 0 ? (
          <div className="w-full border-t px-3 py-2 text-muted-foreground text-xs">
            {filteredBlocks.length} template{filteredBlocks.length === 1 ? "" : "s"} · {events.length} occurrences (±30 days)
          </div>
        ) : null}
      </FluidPanel>
    </table.AppTable>
  );
};
