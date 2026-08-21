"use client";

import { formatWallClockTime } from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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

type GroupMode = "class" | "room" | "teacher";

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABEL: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const formatTime = (value: string) => formatWallClockTime(value);

const matchesFilters = (
  block: ScheduleBlock,
  filters: {
    readonly classFilter: string;
    readonly levelFilter: string;
    readonly query: string;
    readonly roomFilter: string;
    readonly subjectFilter: string;
    readonly teacherFilter: string;
  }
): boolean => {
  const {
    classFilter,
    levelFilter,
    query,
    roomFilter,
    subjectFilter,
    teacherFilter,
  } = filters;

  if (classFilter !== "all" && block.classId !== classFilter) {
    return false;
  }
  if (roomFilter !== "all" && block.roomId !== roomFilter) {
    return false;
  }
  if (subjectFilter !== "all" && block.subjectId !== subjectFilter) {
    return false;
  }
  if (teacherFilter !== "all" && block.teacherId !== teacherFilter) {
    return false;
  }
  if (levelFilter !== "all" && block.levelId !== levelFilter) {
    return false;
  }

  const normalized = query.trim().toLowerCase();

  if (
    normalized &&
    !block.className.toLowerCase().includes(normalized) &&
    !block.code.toLowerCase().includes(normalized) &&
    !(block.subjectName ?? "").toLowerCase().includes(normalized) &&
    !(block.teacherName ?? "").toLowerCase().includes(normalized)
  ) {
    return false;
  }

  return true;
};

const groupKeyFor = (block: ScheduleBlock, mode: GroupMode): string => {
  switch (mode) {
    case "room":
      return block.roomId ?? "__unassigned__";
    case "teacher":
      return block.teacherId ?? "__unassigned__";
    default:
      return block.classId;
  }
};

const groupLabelFor = (block: ScheduleBlock, mode: GroupMode): string => {
  switch (mode) {
    case "room":
      return block.roomName ?? "Unassigned room";
    case "teacher":
      return block.teacherName ?? "Unassigned teacher";
    default:
      return block.className;
  }
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

export const ScheduleCalendar = ({
  blocks,
  filters,
}: ScheduleCalendarProps) => {
  const [mode, setMode] = useState<GroupMode>("class");
  const [classFilter, setClassFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filteredBlocks = useMemo(
    () =>
      blocks.filter((block) =>
        matchesFilters(block, {
          classFilter,
          levelFilter,
          query,
          roomFilter,
          subjectFilter,
          teacherFilter,
        })
      ),
    [
      blocks,
      classFilter,
      levelFilter,
      query,
      roomFilter,
      subjectFilter,
      teacherFilter,
    ]
  );

  const groups = useMemo(() => {
    const grouped = new Map<string, ScheduleBlock[]>();

    for (const block of filteredBlocks) {
      const key = groupKeyFor(block, mode);
      const label = groupLabelFor(block, mode);

      const current = grouped.get(key) ?? [];
      current.push({ ...block, className: label });
      grouped.set(key, current);
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBlocks, mode]);

  const hasLevels = filters.levels.length > 0;

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  ["class", "By Class"],
                  ["room", "By Room"],
                  ["teacher", "By Teacher"],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={
                    mode === value
                      ? "rounded-md bg-background px-3 py-1 font-medium text-sm shadow"
                      : "rounded-md px-3 py-1 font-medium text-muted-foreground text-sm"
                  }
                  key={value}
                  onClick={() => setMode(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative md:ml-auto md:min-w-56">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search schedule..."
                value={query}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect
              label="Class"
              onChange={setClassFilter}
              options={filters.classes}
              value={classFilter}
            />
            {hasLevels ? (
              <FilterSelect
                label="Level"
                onChange={setLevelFilter}
                options={filters.levels}
                value={levelFilter}
              />
            ) : null}
            <FilterSelect
              label="Subject"
              onChange={setSubjectFilter}
              options={filters.subjects}
              value={subjectFilter}
            />
            <FilterSelect
              label="Teacher"
              onChange={setTeacherFilter}
              options={filters.teachers}
              value={teacherFilter}
            />
            <FilterSelect
              label="Room"
              onChange={setRoomFilter}
              options={filters.rooms}
              value={roomFilter}
            />
          </div>
        </CardContent>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No schedules match your filters.
          </CardContent>
        </Card>
      ) : (
        groups.map(([key, groupBlocks]) => (
          <Card key={key}>
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-center gap-2">
                <Badge>{groupBlocks[0]?.className ?? key}</Badge>
                <span className="text-muted-foreground text-xs">
                  {groupBlocks.length} schedule
                  {groupBlocks.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-7">
                {DAY_ORDER.map((day) => {
                  const dayBlocks = groupBlocks
                    .filter((block) => block.dayOfWeek === day)
                    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

                  return (
                    <div
                      className="grid min-h-28 content-start gap-1.5 rounded-md border bg-muted/30 p-2"
                      key={day}
                    >
                      <span className="font-medium text-muted-foreground text-xs">
                        {DAY_LABEL[day]}
                      </span>
                      {dayBlocks.length === 0 ? (
                        <span className="text-muted-foreground/50 text-xs">
                          —
                        </span>
                      ) : (
                        dayBlocks.map((block) => (
                          <Link
                            className="grid gap-0.5 rounded-md border bg-background px-2 py-1.5 text-xs transition-colors hover:bg-accent"
                            href={`/classes/${block.classId}`}
                            key={`${block.classId}-${block.startsAt}-${block.endsAt}-${block.roomId ?? "noroom"}`}
                          >
                            <span className="font-medium">
                              {block.subjectName}
                            </span>
                            <span className="text-muted-foreground">
                              {formatTime(block.startsAt)} -{" "}
                              {formatTime(block.endsAt)}
                            </span>
                            {mode !== "teacher" && block.teacherName ? (
                              <span className="truncate text-muted-foreground">
                                {block.teacherName}
                              </span>
                            ) : null}
                            {mode !== "room" && block.roomName ? (
                              <span className="truncate text-muted-foreground">
                                {block.roomName}
                              </span>
                            ) : null}
                          </Link>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

const FilterSelect = ({
  label,
  onChange,
  options,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: Array<{ readonly id: string; readonly name: string }>;
  readonly value: string;
}) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    <Select
      items={{
        all: `All ${label}s`,
        ...Object.fromEntries(
          options.map((option) => [option.id, option.name])
        ),
      }}
      onValueChange={(v) => onChange(v ?? "")}
      value={value}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
