import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { notFound } from "next/navigation";
import { createErrorWorkbook } from "../../lib/workbook";

const mime =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ importId: string }> }
) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { importId } = await context.params;
  const studentImport = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    select: { id: true },
  });
  if (!studentImport) {
    notFound();
  }
  const rows = await database.studentImportRow.findMany({
    where: {
      importId,
      organizationId: tenant.organizationId,
      status: { in: ["INVALID", "DUPLICATE", "FAILED"] },
    },
    orderBy: { rowNumber: "asc" },
    select: { rawData: true, errors: true },
  });
  if (!rows.length) {
    notFound();
  }
  const workbook = await createErrorWorkbook(rows);
  return new Response(workbook, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="student-import-${importId}-errors.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
};
