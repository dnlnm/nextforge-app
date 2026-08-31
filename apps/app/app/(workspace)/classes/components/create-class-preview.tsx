"use client";

import { formatCalendarDate, parseLocalCalendarDate } from "@repo/date";
import { formatMoney } from "@repo/money";
import {
  BookOpenIcon,
  CalendarRangeIcon,
  Clock3Icon,
  GraduationCapIcon,
  MapPinIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface CreateClassPreviewProperties {
  readonly academicYear: string;
  readonly capacity: string;
  readonly classCode: string;
  readonly currency: string;
  readonly description: string;
  readonly levelName?: string;
  readonly monthlyFee: string;
  readonly name: string;
  readonly rooms: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly schedules: ReadonlyArray<{
    readonly dayOfWeek: string;
    readonly endsAt: string;
    readonly id: string;
    readonly roomId: string;
    readonly startsAt: string;
  }>;
  readonly startDate: string;
  readonly subjectName?: string;
  readonly teacherName?: string;
}

const dayLabels: Record<string, string> = {
  FRIDAY: "Friday",
  MONDAY: "Monday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  THURSDAY: "Thursday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
};

const SidebarLabel = ({ children }: { readonly children: ReactNode }) => (
  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
    {children}
  </p>
);

const ProfileCard = ({ children }: { readonly children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    {children}
  </div>
);

const SummaryRow = ({
  children,
  icon,
}: {
  readonly children: ReactNode;
  readonly icon: ReactNode;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="shrink-0 text-muted-foreground">{icon}</span>
    <span className="min-w-0 truncate">{children}</span>
  </div>
);

export const CreateClassPreview = ({
  academicYear,
  capacity,
  classCode,
  currency,
  description,
  levelName,
  monthlyFee,
  name,
  rooms,
  schedules,
  startDate,
  subjectName,
  teacherName,
}: CreateClassPreviewProperties) => {
  const tags = [levelName, subjectName].filter(Boolean) as string[];
  const startLabel = (() => {
    if (!startDate) {
      return "";
    }
    const parsed = parseLocalCalendarDate(startDate);
    return parsed ? formatCalendarDate(parsed) : startDate;
  })();

  const feeSen = (() => {
    if (!monthlyFee.trim()) {
      return 0;
    }
    const n = Number.parseFloat(monthlyFee);
    return Number.isNaN(n) ? 0 : Math.round(n * 100);
  })();

  return (
    <div className="grid content-start gap-4">
      <SidebarLabel>Class Preview</SidebarLabel>

      <ProfileCard>
        <div className="relative h-16 bg-gradient-to-r from-primary to-primary/70">
          <div className="absolute -bottom-8 left-5">
            <div className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-muted shadow-sm">
              <BookOpenIcon className="size-8 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="px-5 pt-12 pb-5">
          <p
            className={
              name
                ? "font-bold leading-tight"
                : "font-medium text-muted-foreground italic leading-tight"
            }
          >
            {name || "Untitled class"}
          </p>
          <p className="font-mono text-muted-foreground text-xs">
            {classCode || "Auto-generated code"}
          </p>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  className="rounded-md bg-primary/10 px-2 py-1 text-primary text-xs"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 grid gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <CalendarRangeIcon className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Academic Year</span>
              <span className="ml-auto font-medium">{academicYear || "—"}</span>
            </div>
            {teacherName ? (
              <div className="flex items-center gap-2">
                <GraduationCapIcon className="size-3.5 text-muted-foreground" />
                <span className="truncate">{teacherName}</span>
              </div>
            ) : null}
            {capacity ? (
              <div className="flex items-center gap-2">
                <UsersRoundIcon className="size-3.5 text-muted-foreground" />
                <span>Up to {capacity} students</span>
              </div>
            ) : null}
            {feeSen > 0 ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">
                  {formatMoney(feeSen, { currency })}
                </span>
                <span className="text-muted-foreground">/ month</span>
              </div>
            ) : null}
            {startLabel ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3Icon className="size-3.5" />
                <span>Starts {startLabel}</span>
              </div>
            ) : null}
            {description ? (
              <p className="mt-1 line-clamp-3 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </ProfileCard>

      <ProfileCard>
        <div className="grid gap-3 p-4">
          <SidebarLabel>Schedule</SidebarLabel>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No schedules added yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {schedules.map((schedule, index) => {
                const room = rooms.find((r) => r.id === schedule.roomId);
                const dayLabel = schedule.dayOfWeek
                  ? (dayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek)
                  : `Schedule ${index + 1}`;
                return (
                  <div
                    className="grid gap-1.5 border-b pb-3 last:border-b-0 last:pb-0"
                    key={schedule.id}
                  >
                    <p className="font-medium text-sm">{dayLabel}</p>
                    <SummaryRow icon={<Clock3Icon className="size-3.5" />}>
                      {schedule.startsAt && schedule.endsAt
                        ? `${schedule.startsAt} – ${schedule.endsAt}`
                        : "Select time"}
                    </SummaryRow>
                    <SummaryRow icon={<MapPinIcon className="size-3.5" />}>
                      {room?.name ?? "Select room"}
                    </SummaryRow>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ProfileCard>

      <div className="hidden rounded-xl border border-primary/10 bg-secondary/40 p-4 sm:block">
        <p className="mb-2 font-semibold text-primary text-xs">Quick Tips</p>
        <ul className="grid gap-1.5 text-muted-foreground text-xs">
          {[
            "Use + Add another day for multiple weekly sessions.",
            "Class code auto-generates from subject, level and year.",
            "Fee and capacity are shown live in the preview.",
          ].map((tip) => (
            <li className="flex gap-2" key={tip}>
              <span className="shrink-0 text-primary">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
