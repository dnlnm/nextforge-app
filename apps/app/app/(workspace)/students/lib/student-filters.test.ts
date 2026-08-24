import type { StudentTableFilter } from "@repo/schemas/students";
import { describe, expect, it } from "vitest";
import { foldFilterRules } from "./student-filters";

const rule = (overrides: Partial<StudentTableFilter>): StudentTableFilter => ({
  id: "class",
  operator: "in",
  value: ["class-1"],
  variant: "multiSelect",
  ...overrides,
});

describe("foldFilterRules", () => {
  it("AND-joins unrelated rules", () => {
    const { orGroups, statusScope } = foldFilterRules([
      rule({ id: "class", value: ["c1"] }),
      rule({
        id: "gender",
        operator: "in",
        value: ["MALE"],
        variant: "multiSelect",
      }),
    ]);
    expect(orGroups).toHaveLength(2);
    expect(statusScope).toBeUndefined();
  });

  it("folds consecutive OR-joined rules into one OR group", () => {
    const { orGroups } = foldFilterRules([
      rule({ id: "class", value: ["c1"] }),
      rule({ id: "tutor", value: ["t1"], joinOperator: "or" }),
      rule({
        id: "gender",
        operator: "in",
        value: ["MALE"],
        joinOperator: "and",
      }),
    ]);
    expect(orGroups).toEqual([
      [
        expect.objectContaining({ enrollments: expect.anything() }),
        expect.objectContaining({ enrollments: expect.anything() }),
      ],
      [expect.objectContaining({ gender: { in: ["MALE"] } })],
    ]);
  });

  it("negates class/tutor rules with NOT + some", () => {
    const { orGroups } = foldFilterRules([
      rule({ id: "class", operator: "not.in", value: ["c1"] }),
    ]);
    expect(orGroups[0][0]).toEqual({
      NOT: {
        enrollments: {
          some: { classId: { in: ["c1"] }, status: "ACTIVE", archivedAt: null },
        },
      },
    });
  });

  it("widens archived scope when a status rule includes ARCHIVED", () => {
    const both = foldFilterRules([
      rule({
        id: "status",
        operator: "eq",
        value: ["ACTIVE", "ARCHIVED"],
        variant: "select",
      }),
    ]);
    expect(both.statusScope).toBe("all");

    const archivedOnly = foldFilterRules([
      rule({
        id: "status",
        operator: "eq",
        value: ["ARCHIVED"],
        variant: "select",
      }),
    ]);
    expect(archivedOnly.statusScope).toBe("archivedOnly");

    const activeOnly = foldFilterRules([
      rule({
        id: "status",
        operator: "eq",
        value: ["ACTIVE"],
        variant: "select",
      }),
    ]);
    expect(activeOnly.statusScope).toBeUndefined();
  });

  it("drops unknown ids and invalid values instead of erroring", () => {
    const { orGroups, statusScope } = foldFilterRules([
      rule({ id: "evil", value: ["x"] }),
      rule({ id: "gender", operator: "in", value: [] }),
      rule({ id: "academicLevel", operator: "in", value: ["STD 4"] }),
    ]);
    expect(orGroups).toHaveLength(1);
    expect(statusScope).toBeUndefined();
  });

  it("supports text rules on fullName", () => {
    const { orGroups } = foldFilterRules([
      rule({
        id: "fullName",
        operator: "ilike",
        value: "ahmad",
        variant: "text",
      }),
    ]);
    expect(orGroups[0][0]).toEqual({
      fullName: { contains: "ahmad", mode: "insensitive" },
    });
  });
});
