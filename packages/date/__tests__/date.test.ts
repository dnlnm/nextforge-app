import { enUS, ms } from "date-fns/locale";
import { describe, expect, test } from "vitest";
import {
  addMalaysiaCalendarDays,
  differenceInMalaysiaCalendarDays,
  formatCalendarDate,
  formatDateTime,
  formatLongDate,
  formatLongMonthYear,
  formatMediumDate,
  formatMonthLabel,
  formatRelativeTime,
  formatShortDate,
  formatTime,
  formatWallClockTime,
  formatWeekdayDate,
  getAcademicYearStart,
  getDateFormatLocale,
  getMalaysiaCalendarDate,
  getMalaysiaToday,
  getMalaysiaWeekday,
  isCalendarDate,
  isExpired,
  parseCalendarDate,
  parseLocalCalendarDate,
  toLocalDayEpoch,
  toUtcDayEpoch,
  tryParseCalendarDate,
} from "..";

describe("calendar dates", () => {
  test("parses valid dates at UTC midnight", () => {
    expect(parseCalendarDate("2024-02-29").toISOString()).toBe(
      "2024-02-29T00:00:00.000Z"
    );
  });

  test("rejects malformed and impossible dates", () => {
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-2-03")).toBe(false);
    expect(isCalendarDate("15/08/2026")).toBe(false);
    expect(tryParseCalendarDate("2026-02-30")).toBeUndefined();
    expect(() => parseCalendarDate("2026-02-30")).toThrow(RangeError);
  });

  test("formats using UTC calendar fields", () => {
    expect(formatCalendarDate(new Date("2026-08-15T23:00:00.000Z"))).toBe(
      "2026-08-15"
    );
  });
});

describe("Malaysia calendar", () => {
  test("uses the Kuala Lumpur day around UTC rollover", () => {
    const beforeRollover = new Date("2026-08-15T15:59:59.999Z");
    const afterRollover = new Date("2026-08-15T16:00:00.000Z");

    expect(getMalaysiaCalendarDate(beforeRollover)).toBe("2026-08-15");
    expect(getMalaysiaCalendarDate(afterRollover)).toBe("2026-08-16");
    expect(getMalaysiaToday(afterRollover).toISOString()).toBe(
      "2026-08-16T00:00:00.000Z"
    );
  });

  test("returns the weekday in the Malaysia timezone", () => {
    expect(getMalaysiaWeekday(new Date("2026-08-15T16:00:00.000Z"))).toBe(
      "SUNDAY"
    );
  });

  test("adds calendar days while preserving the Malaysia wall clock", () => {
    const date = new Date("2026-12-30T15:30:00.000Z");

    expect(addMalaysiaCalendarDays(date, 3).toISOString()).toBe(
      "2027-01-02T15:30:00.000Z"
    );
  });

  test("counts Malaysia calendar-day boundaries", () => {
    const beforeMidnight = new Date("2026-08-15T15:59:00.000Z");
    const afterMidnight = new Date("2026-08-15T16:01:00.000Z");

    expect(
      differenceInMalaysiaCalendarDays(afterMidnight, beforeMidnight)
    ).toBe(1);
    expect(
      differenceInMalaysiaCalendarDays(beforeMidnight, afterMidnight)
    ).toBe(-1);
  });
});

describe("instant expiration", () => {
  const expiration = new Date("2026-08-15T12:00:00.000Z");

  test("is active before expiration", () => {
    expect(isExpired(expiration, new Date("2026-08-15T11:59:59.999Z"))).toBe(
      false
    );
  });

  test("expires at and after the exact boundary", () => {
    expect(isExpired(expiration, expiration)).toBe(true);
    expect(isExpired(expiration, new Date("2026-08-15T12:00:00.001Z"))).toBe(
      true
    );
  });
});

describe("display formatting", () => {
  test("formats a short Malaysian date", () => {
    expect(formatShortDate(new Date(2026, 7, 15))).toBe("15 Aug 2026");
  });

  test("formats a wall-clock time", () => {
    expect(formatWallClockTime("09:30")).toBe("9:30 am");
    expect(formatWallClockTime("14:05")).toBe("2:05 pm");
    expect(formatTime(new Date(2026, 7, 15, 9, 30))).toBe("9:30 am");
  });

  test("maps route locales to date-fns locales", () => {
    expect(getDateFormatLocale("en")).toBe(enUS);
    expect(getDateFormatLocale("ms")).toBe(ms);
    expect(getDateFormatLocale("ms-MY")).toBe(ms);
  });

  test("formats a long date in English and Malay", () => {
    expect(formatLongDate(new Date(2026, 7, 15), "en")).toBe("August 15, 2026");
    expect(formatLongDate(new Date(2026, 7, 15), "ms")).toBe("15 Ogos 2026");
  });

  test("formats the remaining application display shapes", () => {
    const date = new Date(2026, 7, 15, 9, 30);

    expect(formatWeekdayDate(date)).toBe("Sat, 15 Aug");
    expect(formatDateTime(date)).toBe("15 Aug 2026, 9:30 am");
    expect(formatMediumDate(date)).toBe("15 Aug 2026");
    expect(formatLongMonthYear(date)).toBe("August 2026");
  });

  test("preserves the existing relative-time wording", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");

    expect(formatRelativeTime(new Date("2026-08-15T11:59:45.000Z"), now)).toBe(
      "Just now"
    );
    expect(formatRelativeTime(new Date("2026-08-15T10:00:00.000Z"), now)).toBe(
      "2 hours ago"
    );
  });

  test("parses a calendar date as local midnight", () => {
    const date = parseLocalCalendarDate("2026-08-15");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(15);
    expect(parseLocalCalendarDate("2026-02-30")).toBeUndefined();
  });
});

describe("day normalization", () => {
  test("normalizes a UTC-midnight date to its UTC day epoch", () => {
    expect(toUtcDayEpoch(new Date("2026-08-15T00:00:00.000Z"))).toBe(
      Date.UTC(2026, 7, 15)
    );
    expect(toUtcDayEpoch(new Date("2026-08-15T23:59:59.999Z"))).toBe(
      Date.UTC(2026, 7, 15)
    );
  });

  test("normalizes a local date to its local calendar day epoch", () => {
    expect(toLocalDayEpoch(new Date(2026, 7, 15, 9, 30))).toBe(
      Date.UTC(2026, 7, 15)
    );
  });

  test("computes the academic year start in UTC", () => {
    expect(
      getAcademicYearStart(new Date(Date.UTC(2026, 5, 1))).toISOString()
    ).toBe("2025-07-01T00:00:00.000Z");
    expect(
      getAcademicYearStart(new Date(Date.UTC(2026, 6, 15))).toISOString()
    ).toBe("2026-07-01T00:00:00.000Z");
  });

  test("formats a month label in UTC", () => {
    expect(formatMonthLabel(new Date(Date.UTC(2026, 7, 1)))).toBe("Aug 26");
  });
});
