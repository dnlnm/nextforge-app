import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { createStudentTemplate } from "../import/lib/workbook";

const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const levels = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { code: true, name: true },
  });
  const workbook = await createStudentTemplate(levels);
  return new Response(workbook, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": 'attachment; filename="klio-student-import-template.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
};
