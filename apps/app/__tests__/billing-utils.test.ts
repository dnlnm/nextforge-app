import { describe, expect, test } from "vitest";
import { daysUntil } from "../app/(workspace)/billing/billing-utils";

describe("daysUntil", () => {
  test("returns null without a deadline", () => {
    expect(daysUntil()).toBeNull();
  });

  test("counts Malaysia calendar-day boundaries", () => {
    const now = new Date("2026-08-15T15:59:00.000Z");

    expect(daysUntil(new Date("2026-08-15T16:01:00.000Z"), now)).toBe(1);
    expect(daysUntil(new Date("2026-08-15T15:59:30.000Z"), now)).toBe(0);
  });

  test("returns negative days for past deadlines", () => {
    const now = new Date("2026-08-16T16:01:00.000Z");

    expect(daysUntil(new Date("2026-08-15T15:59:00.000Z"), now)).toBe(-2);
  });
});
