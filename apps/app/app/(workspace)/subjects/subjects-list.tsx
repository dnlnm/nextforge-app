"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { BookOpenIcon, Edit3Icon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { archiveSubject } from "./actions";
import { AddSubjectDialog } from "./add-subject-dialog";

export interface SubjectClassSummary {
  branchName: string | null;
  capacity: number | null;
  id: string;
  levelName: string | null;
  monthlyFeeSen: number;
  name: string;
  schedules: Array<{
    dayOfWeek: string;
    endsAt: string;
    roomName: string | null;
    startsAt: string;
  }>;
  studentCount: number;
  teacherName: string | null;
}

export interface SubjectSummary {
  classCount: number;
  classes: SubjectClassSummary[];
  code: string;
  description: string | null;
  feeMaxSen: number | null;
  feeMinSen: number | null;
  id: string;
  name: string;
  studentCount: number;
  teacherCount: number;
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

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const formatTime = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number.parseInt(hour, 10), Number.parseInt(minute, 10), 0, 0);

  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatSchedule = (subjectClass: SubjectClassSummary) =>
  subjectClass.schedules.length > 0
    ? subjectClass.schedules
        .map(
          (schedule) =>
            `${dayLabel[schedule.dayOfWeek] ?? schedule.dayOfWeek} ${formatTime(schedule.startsAt)}–${formatTime(schedule.endsAt)}${schedule.roomName ? ` · ${schedule.roomName}` : ""}`
        )
        .join(", ")
    : "No schedule";

const formatFeeRange = (subject: SubjectSummary) => {
  if (subject.feeMinSen === null || subject.feeMaxSen === null) {
    return "—";
  }

  if (subject.feeMinSen === subject.feeMaxSen) {
    return `${formatMoney(subject.feeMinSen)}/mo`;
  }

  return `${formatMoney(subject.feeMinSen)}–${formatMoney(subject.feeMaxSen)}/mo`;
};

const SubjectRow = ({ subject }: { readonly subject: SubjectSummary }) => (
  <span className="flex w-full min-w-0 flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <BookOpenIcon className="size-4" />
      </span>
      <span className="truncate font-medium text-foreground">
        {subject.name}
      </span>
      <Badge variant="outline">{subject.code}</Badge>
    </span>
    <span className="flex items-center gap-2 pl-12 text-muted-foreground text-sm sm:gap-3 sm:pl-0">
      <span>{subject.classCount} classes</span>
      <span aria-hidden="true">·</span>
      <span>{subject.studentCount} students</span>
      <span aria-hidden="true">·</span>
      <span>{subject.teacherCount} teachers</span>
      <span className="font-medium text-foreground tabular-nums">
        {formatFeeRange(subject)}
      </span>
    </span>
  </span>
);

const SubjectDetail = ({ subject }: { readonly subject: SubjectSummary }) => (
  <div className="grid gap-3 pl-12">
    <div className="grid gap-3">
      {subject.classes.length === 0 ? (
        <p className="py-1 text-muted-foreground text-sm">
          No classes teach this subject yet.
        </p>
      ) : (
        subject.classes.map((subjectClass) => (
          <div
            className="grid gap-1 rounded-md border p-3"
            key={subjectClass.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                className="font-medium hover:underline"
                href={`/classes/${subjectClass.id}`}
              >
                {subjectClass.name}
              </Link>
              <span className="font-medium text-sm tabular-nums">
                {formatMoney(subjectClass.monthlyFeeSen)}/month
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {[
                subjectClass.levelName ?? "General",
                subjectClass.branchName ?? "Main branch",
                subjectClass.teacherName ?? "No teacher",
                formatSchedule(subjectClass),
                `${subjectClass.studentCount}/${subjectClass.capacity ?? "–"} students`,
              ].join(" · ")}
            </p>
          </div>
        ))
      )}
    </div>

    {subject.description ? (
      <p className="max-w-2xl text-muted-foreground text-sm">
        {subject.description}
      </p>
    ) : null}

    <div className="flex flex-wrap gap-2 pt-1">
      <Button asChild size="sm" variant="outline">
        <Link href={`/subjects/${subject.id}`}>View profile</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`/subjects/${subject.id}/edit`}>
          <Edit3Icon className="size-4" />
          Edit
        </Link>
      </Button>
      <form action={archiveSubject}>
        <input name="subjectId" type="hidden" value={subject.id} />
        <Button size="sm" variant="outline">
          Archive
        </Button>
      </form>
    </div>
  </div>
);

const EmptyState = ({ query }: { readonly query: string }) => (
  <div className="grid place-items-center gap-3 p-10 text-center">
    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <BookOpenIcon className="size-5" />
    </div>
    <div className="grid gap-1">
      <p className="font-medium text-sm">
        {query ? "No matching subjects" : "No subjects yet"}
      </p>
      <p className="max-w-sm text-muted-foreground text-sm">
        {query
          ? "Try a different name or code."
          : "Add your first subject to start building classes and monthly fees."}
      </p>
    </div>
    {query ? null : <AddSubjectDialog />}
  </div>
);

const SubjectsList = ({
  subjects,
}: {
  readonly subjects: SubjectSummary[];
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return subjects;
    }

    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(normalized) ||
        subject.code.toLowerCase().includes(normalized)
    );
  }, [query, subjects]);

  return (
    <Card className="gap-0">
      {subjects.length > 0 ? (
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search subjects"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or code"
              value={query}
            />
          </div>
          <p className="shrink-0 text-muted-foreground text-xs sm:pr-2">
            {filtered.length} of {subjects.length} subjects
          </p>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <Accordion className="px-4" collapsible type="single">
          {filtered.map((subject) => (
            <AccordionItem key={subject.id} value={subject.id}>
              <AccordionTrigger className="items-center gap-4 py-3 hover:no-underline">
                <SubjectRow subject={subject} />
              </AccordionTrigger>
              <AccordionContent>
                <SubjectDetail subject={subject} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
};

export default SubjectsList;
