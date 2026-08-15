import { createHash } from "node:crypto";
import type { Gender, GuardianRelationship } from "@repo/database";
import {
  formatCalendarDate,
  tryParseCalendarDate,
} from "@repo/date";
import ExcelJS from "exceljs";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;
export const IMPORT_BATCH_SIZE = 100;

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

export interface NormalizedStudentRow {
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
}

export interface ParsedImportRow {
  errors: string[];
  fingerprint?: string;
  normalized?: NormalizedStudentRow;
  rawData: RawImportData;
  rowNumber: number;
  status: "VALID" | "INVALID" | "DUPLICATE";
}

const requiredColumns = new Set<ColumnName>([
  "Student Name",
  "Gender",
  "Academic Level",
  "Guardian Name",
  "Guardian Relationship",
  "Guardian Phone",
]);
const phoneRegex = /^01\d{8,10}$/;
const postcodeRegex = /^\d{5}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const phoneSeparatorsRegex = /[-\s]/g;
const requiredMarkerRegex = / \*$/;
const formulaPrefixRegex = /^[=+\-@]/;
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

const textValue = (cell: ExcelJS.Cell) => {
  if (cell.type === ExcelJS.ValueType.Formula) {
    return "";
  }
  if (cell.value instanceof Date) {
    return formatCalendarDate(cell.value);
  }
  return cell.text.trim();
};

const parseDate = (value: string, label: string, errors: string[]) => {
  if (!value) {
    return undefined;
  }
  if (!dateRegex.test(value)) {
    errors.push(`${label} must use YYYY-MM-DD.`);
    return undefined;
  }
  const date = tryParseCalendarDate(value);
  if (!date) {
    errors.push(`${label} is not a valid date.`);
    return undefined;
  }
  return date.toISOString();
};

export const createStudentTemplate = async (
  levels: Array<{ code: string; name: string }>
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KLIO";
  const instructions = workbook.addWorksheet("Instructions");
  instructions.getColumn(1).width = 100;
  instructions.addRow(["Student Bulk Import"]);
  instructions.getCell("A1").font = { bold: true, size: 18 };
  const instructionLines = [
    "1. Fill in the Students sheet. Do not rename or remove headers.",
    "2. Required columns are marked with an asterisk in the header.",
    "3. Use YYYY-MM-DD for dates and keep phone numbers as text.",
    "4. Select Gender, Academic Level, and Guardian Relationship from the dropdowns.",
    "5. Invalid rows are skipped; valid rows are imported only after confirmation.",
    "6. Duplicate rows in the same workbook are skipped. Existing students are not matched by name.",
    "7. Save as .xlsx and upload through KLIO.",
    "",
    "Example: Ahmad Bin Ali | Male | Standard 4 | Ali Bin Omar | Father | 0123456789",
  ];
  for (const line of instructionLines) {
    instructions.addRow([line]);
  }

  const students = workbook.addWorksheet("Students", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  students.columns = columns.map((header) => ({
    header: `${header}${requiredColumns.has(header) ? " *" : ""}`,
    key: header,
    width: Math.max(16, header.length + 3),
  }));
  students.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  students.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  students.autoFilter = { from: "A1", to: `S${MAX_IMPORT_ROWS + 1}` };

  const lists = workbook.addWorksheet("Lists", { state: "veryHidden" });
  for (const [index, value] of ["Male", "Female", "Other"].entries()) {
    lists.getCell(index + 1, 1).value = value;
  }
  for (const [index, value] of [
    "Father",
    "Mother",
    "Guardian",
    "Other",
  ].entries()) {
    lists.getCell(index + 1, 2).value = value;
  }
  for (const [index, level] of levels.entries()) {
    lists.getCell(index + 1, 3).value = `${level.code} - ${level.name}`;
  }

  for (let row = 2; row <= MAX_IMPORT_ROWS + 1; row += 1) {
    students.getCell(row, 4).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ["Lists!$A$1:$A$3"],
    };
    students.getCell(row, 13).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`Lists!$C$1:$C$${Math.max(1, levels.length)}`],
    };
    students.getCell(row, 17).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ["Lists!$B$1:$B$4"],
    };
    for (const column of [3, 14]) {
      students.getCell(row, column).numFmt = "yyyy-mm-dd";
    }
    for (const column of [5, 11, 18]) {
      students.getCell(row, column).numFmt = "@";
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const parseStudentWorkbook = async ({
  buffer,
  levels,
}: {
  buffer: Buffer;
  levels: Array<{ id: string; code: string; name: string }>;
  // Workbook parsing deliberately keeps normalization and validation together
  // so every error remains attached to the original Excel row.
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: staged validation is clearer in one pass
}) => {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new Error(
      "The workbook is corrupted or is not a readable .xlsx file."
    );
  }
  const sheet = workbook.getWorksheet("Students");
  if (!sheet) {
    throw new Error('The required "Students" worksheet is missing.');
  }

  const headerValues = sheet.getRow(1).values;
  const headers: string[] = Array.isArray(headerValues)
    ? Array.from({ length: Math.max(0, headerValues.length - 1) }, (_, index) =>
        String(headerValues[index + 1] ?? "")
          .trim()
          .replace(requiredMarkerRegex, "")
      )
    : [];
  const usedHeaders = headers.filter(Boolean);
  let lastHeaderIndex = headers.length - 1;
  while (lastHeaderIndex >= 0 && !headers[lastHeaderIndex]) {
    lastHeaderIndex -= 1;
  }
  if (headers.slice(0, lastHeaderIndex + 1).some((header) => !header)) {
    throw new Error("The header row contains an empty column name.");
  }
  const duplicates = usedHeaders.filter(
    (header, index) => usedHeaders.indexOf(header) !== index
  );
  if (duplicates.length) {
    throw new Error(
      `Duplicate headers: ${[...new Set(duplicates)].join(", ")}.`
    );
  }
  const missing = [...requiredColumns].filter(
    (column) => !usedHeaders.includes(column)
  );
  if (missing.length) {
    throw new Error(
      `Missing required template columns: ${missing.join(", ")}.`
    );
  }
  const unexpected = usedHeaders.filter(
    (header) => !columns.includes(header as ColumnName)
  );

  const levelByLabel = new Map<string, string>();
  for (const level of levels) {
    levelByLabel.set(level.name.toLowerCase(), level.id);
    levelByLabel.set(level.code.toLowerCase(), level.id);
    levelByLabel.set(`${level.code} - ${level.name}`.toLowerCase(), level.id);
  }
  const rows: ParsedImportRow[] = [];
  const fingerprints = new Set<string>();
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const rawData = Object.fromEntries(
      columns.map((column) => {
        const index = headers.indexOf(column);
        return [column, index >= 0 ? textValue(row.getCell(index + 1)) : ""];
      })
    ) as RawImportData;
    if (Object.values(rawData).every((value) => !value)) {
      continue;
    }
    if (rows.length >= MAX_IMPORT_ROWS) {
      throw new Error(
        `The workbook exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit.`
      );
    }

    const errors: string[] = [];
    const formulaColumns = columns.filter((column) => {
      const index = headers.indexOf(column);
      return (
        index >= 0 && row.getCell(index + 1).type === ExcelJS.ValueType.Formula
      );
    });
    if (formulaColumns.length) {
      errors.push(
        `Formula cells are not allowed: ${formulaColumns.join(", ")}.`
      );
    }
    const fullName = rawData["Student Name"];
    const guardianName = rawData["Guardian Name"];
    const guardianPhone = rawData["Guardian Phone"];
    if (!fullName) {
      errors.push("Student name is required.");
    }
    if (!guardianName) {
      errors.push("Guardian name is required.");
    }
    if (!guardianPhone) {
      errors.push("Guardian phone is required.");
    } else if (
      !phoneRegex.test(guardianPhone.replace(phoneSeparatorsRegex, ""))
    ) {
      errors.push("Guardian phone is invalid.");
    }
    const studentPhone = rawData["Student Phone"];
    if (
      studentPhone &&
      !phoneRegex.test(studentPhone.replace(phoneSeparatorsRegex, ""))
    ) {
      errors.push("Student phone is invalid.");
    }
    const studentEmail = rawData["Student Email"];
    const guardianEmail = rawData["Guardian Email"];
    if (!(studentEmail || guardianEmail)) {
      errors.push("A student or guardian email is required.");
    }
    if (studentEmail && !emailRegex.test(studentEmail)) {
      errors.push("Student email is invalid.");
    }
    if (guardianEmail && !emailRegex.test(guardianEmail)) {
      errors.push("Guardian email is invalid.");
    }
    const postcode = rawData.Postcode;
    if (postcode && !postcodeRegex.test(postcode)) {
      errors.push("Postcode must contain 5 digits.");
    }
    const gender = genderByLabel.get(rawData.Gender.toLowerCase());
    if (!gender) {
      errors.push("Gender is invalid.");
    }
    const relationship = relationshipByLabel.get(
      rawData["Guardian Relationship"].toLowerCase()
    );
    if (!relationship) {
      errors.push("Guardian relationship is invalid.");
    }
    const levelId = levelByLabel.get(rawData["Academic Level"].toLowerCase());
    if (!levelId) {
      errors.push("Academic level does not exist in this tuition centre.");
    }
    const dateOfBirth = parseDate(
      rawData["Date of Birth"],
      "Date of birth",
      errors
    );
    const enrolledAt = parseDate(
      rawData["Enrolled Date"],
      "Enrolled date",
      errors
    );

    const fingerprint = createHash("sha256")
      .update(JSON.stringify(rawData))
      .digest("hex");
    let status: ParsedImportRow["status"] = errors.length ? "INVALID" : "VALID";
    if (!errors.length && fingerprints.has(fingerprint)) {
      errors.push("Duplicate row in this workbook.");
      status = "DUPLICATE";
    }
    fingerprints.add(fingerprint);
    rows.push({
      rowNumber,
      rawData,
      errors,
      fingerprint,
      status,
      normalized:
        status === "VALID" && gender && relationship && levelId
          ? {
              fullName,
              preferredName: rawData["Preferred Name"] || undefined,
              dateOfBirth,
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
              enrolledAt,
              notes: rawData.Notes || undefined,
              guardianName,
              relationship,
              guardianPhone,
              guardianEmail: guardianEmail || undefined,
            }
          : undefined,
    });
  }
  if (!rows.length) {
    throw new Error("The Students worksheet contains no data rows.");
  }
  return {
    rows,
    warnings: unexpected.length
      ? [`Unexpected columns were ignored: ${unexpected.join(", ")}.`]
      : [],
  };
};

const safeExcelText = (value: string) =>
  formulaPrefixRegex.test(value) ? `'${value}` : value;

export const createErrorWorkbook = async (
  rows: Array<{ rawData: unknown; errors: unknown }>
) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Errors");
  sheet.columns = [...columns, "Import Error"].map((header) => ({
    header,
    key: header,
    width: Math.max(16, header.length + 3),
  }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const raw = row.rawData as RawImportData;
    const errors = Array.isArray(row.errors) ? row.errors.map(String) : [];
    sheet.addRow(
      Object.fromEntries([
        ...columns.map((column) => [
          column,
          safeExcelText(String(raw[column] ?? "")),
        ]),
        ["Import Error", errors.join("; ")],
      ])
    );
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
};
