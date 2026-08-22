import { createHash } from "node:crypto";
import type { Gender, GuardianRelationship } from "@repo/database";
import { tryParseCalendarDate } from "@repo/date";

export const columns = [
  "Student Name",
  "Preferred Name",
  "Date of Birth",
  "Gender",
  "Student Phone",
  "Student Email",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "Postcode",
  "School Name",
  "Academic Level",
  "Enrolled Date",
  "Notes",
  "Guardian Name",
  "Guardian Relationship",
  "Guardian Phone",
  "Guardian Email",
] as const;

export type ColumnName = (typeof columns)[number];
export type RawImportData = Record<ColumnName, string>;

export const TEMPLATE_VERSION = "student-import-v2";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationCode =
  | "REQUIRED"
  | "INVALID_DATE"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "INVALID_ENUM"
  | "INVALID_FORMAT"
  | "FORMULA_CELL"
  | "DUPLICATE_IN_FILE"
  | "UNKNOWN";

// biome-ignore lint/style/useConsistentTypeDefinitions: Prisma Json input types need implicit index signatures
export type ValidationIssue = {
  field: ColumnName | null;
  code: ValidationCode;
  severity: ValidationSeverity;
  message: string;
};

export type ImportRowStatus = "VALID" | "INVALID" | "DUPLICATE";

// biome-ignore lint/style/useConsistentTypeDefinitions: Prisma Json input types need implicit index signatures
export type NormalizedStudentRow = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  dateOfBirth?: string;
  enrolledAt?: string;
  fullName: string;
  gender: Gender;
  guardianEmail?: string;
  guardianName: string;
  guardianPhone: string;
  levelId: string;
  notes?: string;
  phone?: string;
  postcode?: string;
  preferredName?: string;
  relationship: GuardianRelationship;
  schoolName?: string;
  state?: string;
  studentEmail?: string;
};

export interface RowValidationContext {
  formulaFields?: ColumnName[];
  levels: Array<{ id: string; code: string; name: string }>;
}

export interface RowValidationResult {
  fingerprint: string;
  issues: ValidationIssue[];
  normalized?: NormalizedStudentRow;
  status: Extract<ImportRowStatus, "VALID" | "INVALID">;
}

const requiredFields: Array<{ column: ColumnName; label: string }> = [
  { column: "Student Name", label: "Student name" },
  { column: "Guardian Name", label: "Guardian name" },
  { column: "Guardian Phone", label: "Guardian phone" },
];

const phoneRegex = /^01\d{8,10}$/;
const postcodeRegex = /^\d{5}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const phoneSeparatorsRegex = /[-\s]/g;
const genderByLabel = new Map<string, Gender>([
  ["male", "MALE"],
  ["female", "FEMALE"],
  ["other", "OTHER"],
]);
const relationshipByLabel = new Map<string, GuardianRelationship>([
  ["father", "FATHER"],
  ["mother", "MOTHER"],
  ["guardian", "GUARDIAN"],
  ["other", "OTHER"],
]);

const issue = (
  field: ColumnName | null,
  code: ValidationCode,
  message: string
): ValidationIssue => ({ field, code, severity: "error", message });

const parseDateString = (value: string): { iso?: string; message?: string } => {
  if (!value) {
    return {};
  }
  if (!dateRegex.test(value)) {
    return { message: "must use YYYY-MM-DD." };
  }
  const date = tryParseCalendarDate(value);
  if (!date) {
    return { message: "is not a valid date." };
  }
  return { iso: date.toISOString() };
};

export const validateRow = (
  rawInput: RawImportData,
  ctx: RowValidationContext
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: staged row validation is clearer in one pass
): RowValidationResult => {
  // Trim defensively: every caller benefits, nothing downstream sees padding.
  const rawData = Object.fromEntries(
    columns.map((column) => [column, (rawInput[column] ?? "").trim()])
  ) as RawImportData;
  const issues: ValidationIssue[] = [];
  for (const field of ctx.formulaFields ?? []) {
    issues.push(
      issue(field, "FORMULA_CELL", `Formula cells are not allowed: ${field}.`)
    );
  }
  for (const { column, label } of requiredFields) {
    if (!rawData[column]) {
      issues.push(issue(column, "REQUIRED", `${label} is required.`));
    }
  }
  const guardianPhone = rawData["Guardian Phone"];
  if (
    guardianPhone &&
    !phoneRegex.test(guardianPhone.replace(phoneSeparatorsRegex, ""))
  ) {
    issues.push(
      issue("Guardian Phone", "INVALID_PHONE", "Guardian phone is invalid.")
    );
  }
  const studentPhone = rawData["Student Phone"];
  if (
    studentPhone &&
    !phoneRegex.test(studentPhone.replace(phoneSeparatorsRegex, ""))
  ) {
    issues.push(
      issue("Student Phone", "INVALID_PHONE", "Student phone is invalid.")
    );
  }
  const studentEmail = rawData["Student Email"];
  const guardianEmail = rawData["Guardian Email"];
  if (!(studentEmail || guardianEmail)) {
    issues.push(
      issue(null, "REQUIRED", "A student or guardian email is required.")
    );
  }
  if (studentEmail && !emailRegex.test(studentEmail)) {
    issues.push(
      issue("Student Email", "INVALID_EMAIL", "Student email is invalid.")
    );
  }
  if (guardianEmail && !emailRegex.test(guardianEmail)) {
    issues.push(
      issue("Guardian Email", "INVALID_EMAIL", "Guardian email is invalid.")
    );
  }
  const postcode = rawData.Postcode;
  if (postcode && !postcodeRegex.test(postcode)) {
    issues.push(
      issue("Postcode", "INVALID_FORMAT", "Postcode must contain 5 digits.")
    );
  }
  const gender = genderByLabel.get(rawData.Gender.toLowerCase());
  if (!gender) {
    issues.push(issue("Gender", "INVALID_ENUM", "Gender is invalid."));
  }
  const relationship = relationshipByLabel.get(
    rawData["Guardian Relationship"].toLowerCase()
  );
  if (!relationship) {
    issues.push(
      issue(
        "Guardian Relationship",
        "INVALID_ENUM",
        "Guardian relationship is invalid."
      )
    );
  }
  const levelLabel = rawData["Academic Level"].toLowerCase();
  const levelId = ctx.levels.find(
    (level) =>
      level.name.toLowerCase() === levelLabel ||
      level.code.toLowerCase() === levelLabel ||
      `${level.code} - ${level.name}`.toLowerCase() === levelLabel
  )?.id;
  if (!levelId) {
    issues.push(
      issue(
        "Academic Level",
        "INVALID_ENUM",
        "Academic level does not exist in this tuition centre."
      )
    );
  }
  let dateOfBirthIso: string | undefined;
  let enrolledAtIso: string | undefined;
  for (const [column, label] of [
    ["Date of Birth", "Date of birth"],
    ["Enrolled Date", "Enrolled date"],
  ] as const) {
    const parsed = parseDateString(rawData[column]);
    if (parsed.message) {
      issues.push(issue(column, "INVALID_DATE", `${label} ${parsed.message}`));
    }
    if (column === "Date of Birth") {
      dateOfBirthIso = parsed.iso;
    } else {
      enrolledAtIso = parsed.iso;
    }
  }

  const fingerprint = identityFingerprint(rawData, dateOfBirthIso);
  const status = issues.length ? "INVALID" : "VALID";
  return {
    status,
    issues,
    fingerprint,
    normalized:
      status === "VALID" && gender && relationship && levelId
        ? {
            fullName: rawData["Student Name"],
            preferredName: rawData["Preferred Name"] || undefined,
            dateOfBirth: dateOfBirthIso,
            gender,
            phone: studentPhone || undefined,
            studentEmail: studentEmail || undefined,
            addressLine1: rawData["Address Line 1"] || undefined,
            addressLine2: rawData["Address Line 2"] || undefined,
            city: rawData.City || undefined,
            state: rawData.State || undefined,
            postcode: postcode || undefined,
            schoolName: rawData["School Name"] || undefined,
            levelId,
            enrolledAt: enrolledAtIso,
            notes: rawData.Notes || undefined,
            guardianName: rawData["Guardian Name"],
            relationship,
            guardianPhone,
            guardianEmail: guardianEmail || undefined,
          }
        : undefined,
  };
};

// Identity fingerprint for within-file duplicate detection. Deliberately
// ignores cosmetic differences (case, extra spaces, phone separators) so the
// same student typed twice collides.
export const identityFingerprint = (
  rawData: RawImportData,
  dateOfBirthIso?: string
) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        rawData["Student Name"].trim().toLowerCase().replace(/\s+/g, " "),
        dateOfBirthIso ?? "",
        rawData["Guardian Phone"].replace(/\D/g, ""),
      ])
    )
    .digest("hex");

export const markWithinFileDuplicates = <
  T extends {
    status: ImportRowStatus;
    issues: ValidationIssue[];
    fingerprint: string;
    rowNumber?: number;
  },
>(
  rows: T[]
): void => {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const group = groups.get(row.fingerprint);
    if (group) {
      group.push(row);
    } else {
      groups.set(row.fingerprint, [row]);
    }
  }
  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }
    for (const member of group) {
      const others = group
        .filter((row) => row !== member)
        .map((row) => row.rowNumber)
        .filter((value): value is number => typeof value === "number");
      member.issues.push({
        field: null,
        code: "DUPLICATE_IN_FILE",
        severity: "error",
        message: others.length
          ? `Duplicate student identity also appears on row(s) ${others.join(", ")}.`
          : "Duplicate student in this workbook.",
      });
      if (member.status === "VALID") {
        member.status = "DUPLICATE";
      }
    }
  }
};

// Tolerant reader for the errors Json column: new sessions store
// ValidationIssue objects, sessions validated before that stored strings.
export const rowIssues = (value: unknown): ValidationIssue[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): ValidationIssue[] => {
    if (typeof entry === "string") {
      return entry.trim()
        ? [{ field: null, code: "UNKNOWN", severity: "error", message: entry }]
        : [];
    }
    if (entry && typeof entry === "object" && "message" in entry) {
      const candidate = entry as Partial<ValidationIssue>;
      return [
        {
          field: (candidate.field as ColumnName | null | undefined) ?? null,
          code: candidate.code ?? "UNKNOWN",
          severity:
            candidate.severity === "warning" || candidate.severity === "info"
              ? candidate.severity
              : "error",
          message: String(candidate.message),
        },
      ];
    }
    return [];
  });
};

export const issuesToMessages = (value: unknown): string[] =>
  rowIssues(value).map((issueEntry) => issueEntry.message);
