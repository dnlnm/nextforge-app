import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  columns,
  createErrorWorkbook,
  createStudentTemplate,
  parseStudentWorkbook,
} from "../app/(workspace)/students/import/lib/workbook";

const levels = [{ id: "level-1", code: "STD4", name: "Standard 4" }];

const workbookBuffer = async (
  values?: Partial<Record<(typeof columns)[number], string | Date>>
) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.addRow(columns);
  if (values) {
    const defaults: Record<(typeof columns)[number], string | Date> =
      Object.fromEntries(columns.map((column) => [column, ""])) as Record<
        (typeof columns)[number],
        string | Date
      >;
    Object.assign(
      defaults,
      {
        "Student Name": "Ahmad Bin Ali",
        Gender: "Male",
        "Academic Level": "STD4 - Standard 4",
        "Guardian Name": "Ali Bin Omar",
        "Guardian Relationship": "Father",
        "Guardian Phone": "0123456789",
        "Guardian Email": "ali@example.com",
      },
      values
    );
    sheet.addRow(columns.map((column) => defaults[column]));
    sheet.getCell("C2").numFmt = "yyyy-mm-dd";
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

describe("student import workbooks", () => {
  it("generates the required template sheets and tenant level list", async () => {
    const buffer = await createStudentTemplate(levels);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    expect(workbook.getWorksheet("Instructions")).toBeDefined();
    expect(workbook.getWorksheet("Students")).toBeDefined();
    expect(workbook.getWorksheet("Lists")?.state).toBe("veryHidden");
    expect(workbook.getWorksheet("Lists")?.getCell("C1").text).toBe(
      "STD4 - Standard 4"
    );
  });

  it("parses a valid row and resolves its tenant level", async () => {
    const result = await parseStudentWorkbook({
      buffer: await workbookBuffer({
        "Date of Birth": new Date("2015-03-10T00:00:00.000Z"),
      }),
      levels,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.status).toBe("VALID");
    expect(result.rows[0]?.normalized?.levelId).toBe("level-1");
    expect(result.rows[0]?.normalized?.dateOfBirth).toContain("2015-03-10");
  });

  it("rejects a workbook without the Students worksheet", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Wrong sheet");
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await expect(parseStudentWorkbook({ buffer, levels })).rejects.toThrow(
      'required "Students" worksheet'
    );
  });

  it("rejects a corrupted workbook", async () => {
    await expect(
      parseStudentWorkbook({ buffer: Buffer.from("not an xlsx file"), levels })
    ).rejects.toThrow("corrupted");
  });

  it("rejects formula cells", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(columns);
    sheet.addRow(
      columns.map((column) =>
        column === "Student Name"
          ? { formula: 'CONCAT("Ahmad")', result: "Ahmad" }
          : ((
              {
                Gender: "Male",
                "Academic Level": "Standard 4",
                "Guardian Name": "Ali",
                "Guardian Relationship": "Father",
                "Guardian Phone": "0123456789",
                "Guardian Email": "ali@example.com",
              } as Partial<Record<(typeof columns)[number], string>>
            )[column] ?? "")
      )
    );
    const result = await parseStudentWorkbook({
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      levels,
    });
    expect(result.rows[0]?.errors).toContain(
      "Formula cells are not allowed: Student Name."
    );
  });

  it("collects multiple errors and rejects another tenant's level", async () => {
    const result = await parseStudentWorkbook({
      buffer: await workbookBuffer({
        "Student Name": "",
        "Academic Level": "Another Centre Level",
        "Guardian Phone": "invalid",
        "Guardian Email": "invalid",
      }),
      levels,
    });
    expect(result.rows[0]?.status).toBe("INVALID");
    expect(result.rows[0]?.errors).toEqual(
      expect.arrayContaining([
        "Student name is required.",
        "Guardian phone is invalid.",
        "Guardian email is invalid.",
        "Academic level does not exist in this tuition centre.",
      ])
    );
  });

  it("marks repeated workbook rows as duplicates", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(columns);
    const rowValues: Partial<Record<(typeof columns)[number], string>> = {
      "Student Name": "Ahmad",
      Gender: "Male",
      "Academic Level": "Standard 4",
      "Guardian Name": "Ali",
      "Guardian Relationship": "Father",
      "Guardian Phone": "0123456789",
      "Guardian Email": "ali@example.com",
    };
    const values = columns.map((column) => rowValues[column] ?? "");
    sheet.addRow(values);
    sheet.addRow(values);
    const result = await parseStudentWorkbook({
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      levels,
    });
    expect(result.rows.map((row) => row.status)).toEqual([
      "VALID",
      "DUPLICATE",
    ]);
  });

  it("neutralizes formula-like values in error reports", async () => {
    const rawData = Object.fromEntries(
      columns.map((column) => [
        column,
        column === "Student Name" ? "=CMD()" : "",
      ])
    );
    const buffer = await createErrorWorkbook([
      { rawData, errors: ["Invalid row."] },
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    expect(workbook.getWorksheet("Errors")?.getCell("A2").text).toBe("'=CMD()");
  });
});
