import { describe, expect, test } from "vitest";
import { dateRangeFilter } from "../lib/filter-functions";

const rowFor = (value: Date) =>
  ({
    getValue: () => value,
  }) as never;

describe("dateRangeFilter calendar dates", () => {
  test("matches a UTC calendar date against a local picker date", () => {
    const cellDate = new Date("2026-08-15T00:00:00.000Z");
    const pickerDate = new Date(2026, 7, 15);

    expect(dateRangeFilter(rowFor(cellDate), "date", pickerDate.getTime(), () => {})).toBe(
      true
    );
  });

  test("includes both endpoints of a selected date range", () => {
    const from = new Date(2026, 7, 15);
    const to = new Date(2026, 7, 17);

    expect(
      dateRangeFilter(
        rowFor(new Date("2026-08-17T00:00:00.000Z")),
        "date",
        [from.getTime().toString(), to.getTime().toString()],
        () => {}
      )
    ).toBe(true);
    expect(
      dateRangeFilter(
        rowFor(new Date("2026-08-18T00:00:00.000Z")),
        "date",
        [from.getTime().toString(), to.getTime().toString()],
        () => {}
      )
    ).toBe(false);
  });
});
