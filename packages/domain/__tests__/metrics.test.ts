import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  attendanceRate,
  capacityInfo,
  countAttendance,
  invoiceBalanceSen,
  scheduleDurationMinutes,
  summarizeInvoices,
  timesOverlap,
  timeToMinutes,
  weeklyTeachingHours,
  workloadCategory,
} from "../metrics";

describe("time helpers", () => {
  test("parses HH:MM to minutes", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  test("returns null for malformed times", () => {
    expect(timeToMinutes("9am")).toBeNull();
    expect(timeToMinutes("")).toBeNull();
  });

  test("detects overlapping ranges", () => {
    expect(timesOverlap("09:00", "11:00", "10:00", "12:00")).toBe(true);
    expect(timesOverlap("09:00", "11:00", "11:00", "12:00")).toBe(false);
    expect(timesOverlap("09:00", "11:00", "08:00", "09:00")).toBe(false);
  });
});

describe("scheduleDurationMinutes", () => {
  test("computes in-day duration", () => {
    expect(
      scheduleDurationMinutes({ endsAt: "11:00", startsAt: "09:00" })
    ).toBe(120);
  });

  test("computes a schedule crossing midnight", () => {
    expect(
      scheduleDurationMinutes({ endsAt: "01:00", startsAt: "23:00" })
    ).toBe(120);
  });

  test("returns zero for invalid times", () => {
    expect(
      scheduleDurationMinutes({ endsAt: "invalid", startsAt: "09:00" })
    ).toBe(0);
  });
});

describe("weeklyTeachingHours", () => {
  test("sums distinct schedule durations", () => {
    expect(
      weeklyTeachingHours([
        { endsAt: "11:00", startsAt: "09:00" },
        { endsAt: "15:00", startsAt: "13:00" },
      ])
    ).toBe(4);
  });

  test("returns zero for no schedules", () => {
    expect(weeklyTeachingHours([])).toBe(0);
  });
});

describe("attendanceRate", () => {
  test("uses (PRESENT + LATE) over non-EXCUSED records", () => {
    expect(
      attendanceRate(["PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"])
    ).toBe(75);
  });

  test("returns null when the denominator is zero", () => {
    expect(attendanceRate([])).toBeNull();
    expect(attendanceRate(["EXCUSED"])).toBeNull();
  });

  test("rounds to a whole percent", () => {
    expect(attendanceRate(["PRESENT", "ABSENT", "ABSENT"])).toBe(33);
  });
});

describe("countAttendance", () => {
  test("counts each status", () => {
    expect(
      countAttendance(["PRESENT", "LATE", "LATE", "ABSENT", "EXCUSED"])
    ).toEqual({ absent: 1, excused: 1, late: 2, present: 1 });
  });
});

describe("workloadCategory", () => {
  test("is Light for 0-5 classes", () => {
    expect(workloadCategory(0)).toBe("LIGHT");
    expect(workloadCategory(5)).toBe("LIGHT");
  });

  test("is Medium for 6-10 classes", () => {
    expect(workloadCategory(6)).toBe("MEDIUM");
    expect(workloadCategory(10)).toBe("MEDIUM");
  });

  test("is Heavy for 11+ classes", () => {
    expect(workloadCategory(11)).toBe("HEAVY");
  });
});

describe("money helpers", () => {
  test("invoiceBalanceSen never goes below zero", () => {
    expect(invoiceBalanceSen({ amountPaidSen: 4000, totalSen: 5000 })).toBe(
      1000
    );
    expect(invoiceBalanceSen({ amountPaidSen: 6000, totalSen: 5000 })).toBe(0);
  });

  test("summarizeInvoices aggregates totals and outstanding", () => {
    expect(
      summarizeInvoices([
        { amountPaidSen: 4000, totalSen: 5000 },
        { amountPaidSen: 0, totalSen: 3000 },
      ])
    ).toEqual({
      outstandingSen: 4000,
      totalBilledSen: 8000,
      totalPaidSen: 4000,
    });
  });
});

describe("capacityInfo", () => {
  test("marks a class full at capacity", () => {
    expect(capacityInfo(30, 30)).toEqual({
      capacity: 30,
      enrolled: 30,
      isFull: true,
      percentFull: 100,
    });
  });

  test("computes utilization percentage", () => {
    expect(capacityInfo(24, 30)).toEqual({
      capacity: 30,
      enrolled: 24,
      isFull: false,
      percentFull: 80,
    });
  });

  test("treats null capacity as unlimited", () => {
    expect(capacityInfo(5, null)).toEqual({
      capacity: null,
      enrolled: 5,
      isFull: false,
      percentFull: null,
    });
  });
});
