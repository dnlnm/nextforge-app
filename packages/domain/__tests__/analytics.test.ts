import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { monthLabel } from "../analytics";

describe("analytics month labels", () => {
  test("labels a UTC month bucket independent of the runtime timezone", () => {
    expect(monthLabel("2026-08")).toBe("Aug 26");
    expect(monthLabel("2025-07")).toBe("Jul 25");
  });

  test("handles year rollover and single-digit months", () => {
    expect(monthLabel("2025-12")).toBe("Dec 25");
    expect(monthLabel("2026-01")).toBe("Jan 26");
  });
});
