import { tz } from "@date-fns/tz";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isMatch,
} from "date-fns";
import { enUS, ms } from "date-fns/locale";

export const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

const calendarDateFormat = "yyyy-MM-dd";
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const malaysiaTimeZone = tz(MALAYSIA_TIME_ZONE);

const shortDateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  hour: "numeric",
  minute: "2-digit",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const malayLongDateFormatter = new Intl.DateTimeFormat("ms-MY", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const weekdayDateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

const mediumDateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
});

const longMonthYearFormatter = new Intl.DateTimeFormat("en-MY", {
  month: "long",
  year: "numeric",
});

export const isCalendarDate = (value: string): boolean =>
  calendarDatePattern.test(value) && isMatch(value, calendarDateFormat);

export const parseCalendarDate = (value: string): Date => {
  if (!isCalendarDate(value)) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return new Date(`${value}T00:00:00.000Z`);
};

export const tryParseCalendarDate = (value: string): Date | undefined => {
  try {
    return parseCalendarDate(value);
  } catch {
    return undefined;
  }
};

export const formatCalendarDate = (date: Date): string =>
  format(date, calendarDateFormat, { in: tz("UTC") });

export const getMalaysiaCalendarDate = (date = new Date()): string =>
  format(date, calendarDateFormat, { in: malaysiaTimeZone });

export const getMalaysiaToday = (now = new Date()): Date =>
  parseCalendarDate(getMalaysiaCalendarDate(now));

export const getMalaysiaWeekday = (date: Date): Weekday =>
  format(date, "EEEE", { in: malaysiaTimeZone }).toUpperCase() as Weekday;

export const getMalaysiaDateParts = (now = new Date()) => ({
  date: getMalaysiaToday(now),
  dayOfWeek: getMalaysiaWeekday(now),
});

export const addMalaysiaCalendarDays = (date: Date, amount: number): Date =>
  new Date(addDays(date, amount, { in: malaysiaTimeZone }).getTime());

export const differenceInMalaysiaCalendarDays = (
  laterDate: Date,
  earlierDate: Date
): number =>
  differenceInCalendarDays(laterDate, earlierDate, { in: malaysiaTimeZone });

export const isExpired = (expiresAt: Date, now = new Date()): boolean =>
  !isAfter(expiresAt, now);

export const formatShortDate = (date: Date): string =>
  shortDateFormatter.format(date);

export const formatWeekdayDate = (date: Date): string =>
  weekdayDateFormatter.format(date);

export const formatDateTime = (date: Date): string =>
  dateTimeFormatter.format(date);

export const formatMediumDate = (date: Date): string =>
  mediumDateFormatter.format(date);

export const formatLongMonthYear = (date: Date): string =>
  longMonthYearFormatter.format(date);

export const formatRelativeTime = (date: Date, now = new Date()): string => {
  const seconds = Math.max(
    1,
    Math.floor((now.getTime() - date.getTime()) / 1000)
  );
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ] as const;

  for (const [unit, value] of units) {
    const amount = Math.floor(seconds / value);
    if (amount >= 1) {
      return `${amount} ${unit}${amount > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
};

export const formatTime = (date: Date): string => timeFormatter.format(date);

export const parseWallClockTime = (value: string): Date => {
  const [hour = "0", minute = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number.parseInt(hour, 10), Number.parseInt(minute, 10), 0, 0);

  return date;
};

export const formatWallClockTime = (value: string): string =>
  formatTime(parseWallClockTime(value));

export const getDateFormatLocale = (locale: string) =>
  locale.split("-")[0] === "ms" ? ms : enUS;

export const formatLongDate = (date: Date, locale = "en"): string =>
  (locale.split("-")[0] === "ms"
    ? malayLongDateFormatter
    : longDateFormatter
  ).format(date);

export const parseLocalCalendarDate = (value: string): Date | undefined => {
  if (!isCalendarDate(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const toUtcDayEpoch = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const toLocalDayEpoch = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

export const getAcademicYearStart = (now = new Date()): Date => {
  const year = now.getUTCFullYear();
  const academicYear = now.getUTCMonth() >= 6 ? year : year - 1;

  return new Date(Date.UTC(academicYear, 6, 1));
};

const monthShortFormatter = new Intl.DateTimeFormat("en-MY", {
  month: "short",
  timeZone: "UTC",
});

const monthLabelFormatter = new Intl.DateTimeFormat("en-MY", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** e.g. `formatMonthShort(...)` -> "Aug" (no year), in the UTC calendar day. */
export const formatMonthShort = (date: Date): string =>
  monthShortFormatter.format(date);

export const formatMonthLabel = (date: Date): string =>
  monthLabelFormatter.format(date);
