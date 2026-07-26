const needsEscapingRegex = /[,"\n\r]/;

const escapeCsvCell = (value: Date | number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = value instanceof Date ? value.toISOString() : String(value);

  if (needsEscapingRegex.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
};

export const toCsv = (rows: (Date | number | string | null | undefined)[][]) =>
  rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");

export const csvResponse = (
  filename: string,
  rows: (Date | number | string | null | undefined)[][]
) =>
  new Response(`${toCsv(rows)}\n`, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
