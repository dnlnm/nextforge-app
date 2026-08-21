"use client";

import { formatWallClockTime } from "@repo/date";
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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface ClassTableItem {
  readonly capacity: number | null;
  readonly code: string;
  readonly enrollments: readonly { readonly id: string }[];
  readonly id: string;
  readonly level: { readonly name: string } | null;
  readonly name: string;
  readonly schedules: readonly {
    readonly dayOfWeek: string;
    readonly endsAt: string;
    readonly startsAt: string;
    readonly room: { readonly name: string } | null;
  }[];
  readonly status: string;
  readonly subject: { readonly name: string } | null;
  readonly teacher: { readonly fullName: string } | null;
}

const dayLabel: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const whitespaceRegex = /\s+/;

const formatTime = (time: string) => formatWallClockTime(time);

const teacherInitials = (name?: string | null) =>
  name
    ?.split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase() || "--";

const PAGE_SIZE = 10;

export const ClassesTable = ({ classes }: { classes: ClassTableItem[] }) => {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(0);

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          classes
            .map((item) => item.subject?.name)
            .filter((name): name is string => Boolean(name))
        )
      ).sort(),
    [classes]
  );
  const levels = useMemo(
    () =>
      Array.from(
        new Set(classes.map((item) => item.level?.name ?? "General"))
      ).sort(),
    [classes]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes.filter((item) => {
      if (
        query &&
        !item.name.toLowerCase().includes(query) &&
        !item.code.toLowerCase().includes(query) &&
        !(item.subject?.name ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (subjectFilter !== "all" && item.subject?.name !== subjectFilter) {
        return false;
      }
      if (
        levelFilter !== "all" &&
        (item.level?.name ?? "General") !== levelFilter
      ) {
        return false;
      }
      return true;
    });
  }, [classes, levelFilter, search, subjectFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );
  const first = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const last = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);

  return (
    <CardInner>
      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-64 flex-1 sm:max-w-sm">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search classes by name, code or subject..."
              value={search}
            />
          </div>
          <div className="grid w-36 gap-1">
            <span className="text-muted-foreground text-xs">Subject</span>
            <Select
              onValueChange={(value) => {
                setSubjectFilter(value ?? "");
                setPage(0);
              }}
              value={subjectFilter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-36 gap-1">
            <span className="text-muted-foreground text-xs">Level</span>
            <Select
              onValueChange={(value) => {
                setLevelFilter(value ?? "");
                setPage(0);
              }}
              value={levelFilter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setSearch("");
              setSubjectFilter("all");
              setLevelFilter("all");
              setPage(0);
            }}
            variant="outline"
          >
            <FilterIcon className="size-4" />
            Reset
          </Button>
          <Button className="ml-auto" render={<Link href="/classes/new" />}>
            <PlusIcon className="size-4" />
            Add New Class
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Class Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{currentPage * PAGE_SIZE + index + 1}</TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <Link
                      className="font-medium hover:underline"
                      href={`/classes/${item.id}`}
                    >
                      {item.name}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {item.code}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.subject?.name ?? "—"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.level?.name ?? "General"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground text-xs">
                      {teacherInitials(item.teacher?.fullName)}
                    </div>
                    <span>{item.teacher?.fullName ?? "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {item.schedules.length === 0 ? (
                    <span className="text-xs">No schedule</span>
                  ) : (
                    <div className="grid gap-1 text-xs">
                      {item.schedules.map((schedule) => (
                        <span key={schedule.dayOfWeek}>
                          {dayLabel[schedule.dayOfWeek]},{" "}
                          {formatTime(schedule.startsAt)} -{" "}
                          {formatTime(schedule.endsAt)}
                          {schedule.room ? ` (${schedule.room.name})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {item.enrollments.length} / {item.capacity ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.status === "ACTIVE" ? "Active" : "Upcoming"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      render={<Link href={`/classes/${item.id}`} />}
                      size="icon"
                      variant="outline"
                    >
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t p-4 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between">
        <p>
          Showing {first} to {last} of {filtered.length} classes
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={currentPage === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            size="icon"
            variant="outline"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-16 text-center">
            {currentPage + 1} / {pageCount}
          </span>
          <Button
            disabled={currentPage >= pageCount - 1}
            onClick={() =>
              setPage((value) => Math.min(pageCount - 1, value + 1))
            }
            size="icon"
            variant="outline"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </CardInner>
  );
};

const CardInner = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border bg-card text-card-foreground shadow">
    {children}
  </div>
);
