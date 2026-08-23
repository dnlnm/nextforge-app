import { describe, expect, it } from "vitest";
import {
  columns,
  identityFingerprint,
  markWithinFileDuplicates,
  type RawImportData,
  rowIssues,
  type ValidationIssue,
  validateRow,
} from "./validation";

const levels = [{ id: "level-1", code: "STD4", name: "Standard 4" }];

const emptyRow = () =>
  Object.fromEntries(columns.map((column) => [column, ""])) as RawImportData;

const validRow = (overrides?: Partial<RawImportData>): RawImportData => ({
  ...emptyRow(),
  "Student Name": "Ahmad Bin Ali",
  Gender: "Male",
  "Academic Level": "STD4 - Standard 4",
  "Guardian Name": "Ali Bin Omar",
  "Guardian Relationship": "Father",
  "Guardian Phone": "0123456789",
  "Guardian Email": "ali@example.com",
  ...overrides,
});

const codesFor = (row: RawImportData) =>
  validateRow(row, { levels })
    .issues.filter((issue) => issue.severity === "error")
    .map((issue) => `${issue.code}:${issue.field ?? "*"}`);

describe("validateRow", () => {
  it("accepts a complete row and normalizes it", () => {
    const result = validateRow(validRow(), { levels });
    expect(result.status).toBe("VALID");
    expect(result.issues).toHaveLength(0);
    expect(result.normalized).toMatchObject({
      fullName: "Ahmad Bin Ali",
      gender: "MALE",
      relationship: "FATHER",
      levelId: "level-1",
      guardianPhone: "0123456789",
    });
  });

  it("attributes required-field errors to their column", () => {
    const result = validateRow(emptyRow(), { levels });
    expect(codesFor(emptyRow())).toEqual(
      expect.arrayContaining([
        "REQUIRED:Student Name",
        "REQUIRED:Guardian Name",
        "REQUIRED:Guardian Phone",
        "REQUIRED:*",
        "INVALID_ENUM:Gender",
        "INVALID_ENUM:Guardian Relationship",
        "INVALID_ENUM:Academic Level",
      ])
    );
    expect(result.status).toBe("INVALID");
    expect(result.normalized).toBeUndefined();
  });

  it("validates formats with stable codes", () => {
    expect(
      codesFor(
        validRow({
          "Guardian Phone": "12345",
          "Student Phone": "abc",
          Postcode: "12",
          "Date of Birth": "10/03/2015",
          "Enrolled Date": "2015-13-01",
          "Guardian Email": "nope",
        })
      )
    ).toEqual(
      expect.arrayContaining([
        "INVALID_PHONE:Guardian Phone",
        "INVALID_PHONE:Student Phone",
        "INVALID_FORMAT:Postcode",
        "INVALID_DATE:Date of Birth",
        "INVALID_DATE:Enrolled Date",
        "INVALID_EMAIL:Guardian Email",
      ])
    );
  });

  it("requires a student or guardian email", () => {
    const issues = validateRow(
      validRow({ "Guardian Email": "", "Student Email": "" }),
      { levels }
    ).issues;
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "REQUIRED",
        field: null,
        message: "A student or guardian email is required.",
      })
    );
  });

  it("accepts level by name or code, not just the combined label", () => {
    for (const label of ["Standard 4", "std4", "STD4 - Standard 4"]) {
      const result = validateRow(validRow({ "Academic Level": label }), {
        levels,
      });
      expect(result.normalized?.levelId).toBe("level-1");
    }
  });

  it("parses ISO dates into UTC-midnight instants", () => {
    const result = validateRow(validRow({ "Date of Birth": "2015-03-10" }), {
      levels,
    });
    expect(result.normalized?.dateOfBirth).toBe("2015-03-10T00:00:00.000Z");
  });

  it("reports formula cells passed through the context", () => {
    const result = validateRow(validRow(), {
      levels,
      formulaFields: ["Notes"],
    });
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "FORMULA_CELL",
        field: "Notes",
      })
    );
    expect(result.status).toBe("INVALID");
  });

  it("keeps whitespace-only values as missing", () => {
    const row = validRow();
    row["Student Name"] = "   ";
    const result = validateRow(row, { levels });
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "REQUIRED" })
    );
  });
});

describe("identityFingerprint", () => {
  it("collides across case, spacing, and phone separators", () => {
    const base = identityFingerprint(validRow(), "2015-03-10T00:00:00.000Z");
    const variant = identityFingerprint(
      validRow({
        "Student Name": "  ahmad   bin ali ",
        "Guardian Phone": "012-345-6789",
      }),
      "2015-03-10T00:00:00.000Z"
    );
    expect(variant).toBe(base);
  });

  it("separates different students and different birth dates", () => {
    const base = identityFingerprint(validRow(), "2015-03-10T00:00:00.000Z");
    expect(identityFingerprint(validRow(), undefined)).not.toBe(base);
    expect(
      identityFingerprint(validRow({ "Guardian Phone": "0198765432" }), "")
    ).not.toBe(base);
  });
});

describe("markWithinFileDuplicates", () => {
  it("flags every member of a duplicate group", () => {
    const first = {
      status: "VALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "fp-1",
      rowNumber: 2,
    };
    const second = {
      status: "VALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "fp-1",
      rowNumber: 7,
    };
    const other = {
      status: "VALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "fp-2",
      rowNumber: 9,
    };
    markWithinFileDuplicates([first, second, other]);
    expect(first.status).toBe("DUPLICATE");
    expect(second.status).toBe("DUPLICATE");
    expect(other.status).toBe("VALID");
    expect(first.issues[0]).toMatchObject({
      code: "DUPLICATE_IN_FILE",
      severity: "error",
      message: expect.stringContaining("7"),
    });
    expect(second.issues[0]?.message).toContain("2");
  });

  it("never groups rows without a student name", () => {
    const first = {
      status: "INVALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "",
      rowNumber: 2,
    };
    const second = {
      status: "INVALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "",
      rowNumber: 3,
    };
    markWithinFileDuplicates([first, second]);
    expect(first.issues).toHaveLength(0);
    expect(second.issues).toHaveLength(0);
  });

  it("leaves invalid rows invalid but still explains the conflict", () => {
    const invalid = {
      status: "INVALID" as const,
      issues: [
        {
          field: null,
          code: "REQUIRED",
          severity: "error",
          message: "Student name is required.",
        },
      ] as ValidationIssue[],
      fingerprint: "fp-1",
      rowNumber: 3,
    };
    const valid = {
      status: "VALID" as const,
      issues: [] as ValidationIssue[],
      fingerprint: "fp-1",
      rowNumber: 4,
    };
    markWithinFileDuplicates([invalid, valid]);
    expect(invalid.status).toBe("INVALID");
    expect(
      invalid.issues.some((issue) => issue.code === "DUPLICATE_IN_FILE")
    ).toBe(true);
    expect(valid.status).toBe("DUPLICATE");
  });
});

describe("rowIssues", () => {
  it("wraps legacy string arrays as unattributed errors", () => {
    expect(rowIssues(["Old style error.", ""])).toEqual([
      {
        field: null,
        code: "UNKNOWN",
        severity: "error",
        message: "Old style error.",
      },
    ]);
  });

  it("passes structured issues through and drops junk", () => {
    const structured = [
      {
        field: "Gender",
        code: "INVALID_ENUM",
        severity: "error",
        message: "Gender is invalid.",
      },
      { broken: true },
      42,
    ];
    expect(rowIssues(structured)).toEqual([
      {
        field: "Gender",
        code: "INVALID_ENUM",
        severity: "error",
        message: "Gender is invalid.",
      },
    ]);
    expect(rowIssues(null)).toEqual([]);
  });
});
