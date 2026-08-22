import { formatCalendarDate } from "@repo/date";
import ExcelJS from "exceljs";
import {
  type ColumnName,
  columns,
  type ImportRowStatus,
  issuesToMessages,
  markWithinFileDuplicates,
  type RawImportData,
  TEMPLATE_VERSION,
  type ValidationIssue,
  validateRow,
} from "./validation";

export {
  type ColumnName,
  columns,
  type ImportRowStatus,
  issuesToMessages,
  type RawImportData,
  rowIssues,
  TEMPLATE_VERSION,
  type ValidationIssue,
} from "./validation";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;
export const IMPORT_BATCH_SIZE = 100;

const requiredMarkerRegex = / \*$/;
const templateVersionRegex = /student-import-v\d+/i;

interface TemplateLevel {
  code: string;
  name: string;
}

export const createStudentTemplate = async (
  levels: TemplateLevel[],
  centreName?: string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KLIO";
  const instructions = workbook.addWorksheet("Instructions");
  instructions.getColumn(1).width = 100;
  instructions.addRow(["Student Bulk Import"]);
  instructions.getCell("A1").font = { bold: true, size: 18 };
  if (centreName) {
    instructions.addRow([`Tuition centre: ${centreName}`]);
  }
  const instructionLines = [
    "1. Fill in the Students sheet. Do not rename or remove headers.",
    "2. Required columns are marked with an asterisk in the header.",
    "3. Use YYYY-MM-DD for dates and keep phone numbers as text.",
    "4. Select Gender, Academic Level, and Guardian Relationship from the dropdowns.",
    "5. Fix highlighted rows in the import review screen before importing; valid rows are imported only after confirmation.",
    "6. Duplicate students within the same workbook are flagged. Existing students are not matched by name.",
    "7. Save as .xlsx and upload through KLIO.",
    "",
    "Example: Ahmad Bin Ali | Male | Standard 4 | Ali Bin Omar | Father | 0123456789",
    "",
    `Template: ${TEMPLATE_VERSION} · Generated ${new Date().toISOString()}`,
  ];
  for (const line of instructionLines) {
    instructions.addRow([line]);
  }

  const students = workbook.addWorksheet("Students", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const requiredColumns = new Set<ColumnName>([
    "Student Name",
    "Gender",
    "Academic Level",
    "Guardian Name",
    "Guardian Relationship",
    "Guardian Phone",
  ]);
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

export interface ParsedImportRow {
  fingerprint: string;
  issues: ValidationIssue[];
  normalized?: ReturnType<typeof validateRow>["normalized"];
  rawData: RawImportData;
  rowNumber: number;
  status: ImportRowStatus;
}

const textValue = (cell: ExcelJS.Cell) => {
  if (cell.type === ExcelJS.ValueType.Formula) {
    return "";
  }
  if (cell.value instanceof Date) {
    return formatCalendarDate(cell.value);
  }
  return cell.text.trim();
};

// Workbook parsing keeps normalization and validation staged so every error
// remains attached to the original Excel row.
export const parseStudentWorkbook = async ({
  buffer,
  levels,
}: {
  buffer: Buffer;
  levels: Array<{ id: string; code: string; name: string }>;
}): Promise<{
  rows: ParsedImportRow[];
  warnings: string[];
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: header checks must precede row parsing
}> => {
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

  const warnings: string[] = [];
  const instructions = workbook.getWorksheet("Instructions");
  if (instructions) {
    let templateVersion: string | null = null;
    for (
      let rowNumber = 1;
      rowNumber <= instructions.rowCount;
      rowNumber += 1
    ) {
      const match = templateVersionRegex.exec(
        instructions.getCell(rowNumber, 1).text
      );
      if (match) {
        templateVersion = match[0].toLowerCase();
        break;
      }
    }
    if (!templateVersion) {
      warnings.push(
        "Template version could not be detected; continuing with best-effort parsing."
      );
    } else if (templateVersion !== TEMPLATE_VERSION) {
      warnings.push(
        `This template (${templateVersion}) differs from the current version (${TEMPLATE_VERSION}). Download a fresh template for the best experience.`
      );
    }
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
  const requiredColumns = [
    "Student Name",
    "Gender",
    "Academic Level",
    "Guardian Name",
    "Guardian Relationship",
    "Guardian Phone",
  ] as const satisfies readonly ColumnName[];
  const missing = requiredColumns.filter(
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

  const rows: ParsedImportRow[] = [];
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

    const formulaFields = columns.filter((column) => {
      const index = headers.indexOf(column);
      return (
        index >= 0 && row.getCell(index + 1).type === ExcelJS.ValueType.Formula
      );
    });

    const result = validateRow(rawData, { levels, formulaFields });
    rows.push({
      rowNumber,
      rawData,
      status: result.status,
      issues: result.issues,
      fingerprint: result.fingerprint,
      normalized: result.normalized,
    });
  }
  markWithinFileDuplicates(rows);
  if (!rows.length) {
    throw new Error("The Students worksheet contains no data rows.");
  }
  if (unexpected.length) {
    warnings.push(`Unexpected columns were ignored: ${unexpected.join(", ")}.`);
  }
  return { rows, warnings };
};

const formulaPrefixRegex = /^[=+\-@]/;
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
    sheet.addRow(
      Object.fromEntries([
        ...columns.map((column) => [
          column,
          safeExcelText(String(raw[column] ?? "")),
        ]),
        ["Import Error", issuesToMessages(row.errors).join("; ")],
      ])
    );
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
};
