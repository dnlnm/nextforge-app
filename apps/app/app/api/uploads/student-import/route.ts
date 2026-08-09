import { randomUUID } from "node:crypto";
import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { createPresignedUploadUrl } from "@repo/storage";
import { NextResponse } from "next/server";
import { MAX_IMPORT_BYTES } from "../../../(workspace)/students/import/lib/workbook";

const xlsxMime =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const POST = async (request: Request) => {
  try {
    const tenant = await requireTenantRole(["ADMIN"]);
    const body = (await request.json()) as {
      fileName?: unknown;
      fileSize?: unknown;
      fileType?: unknown;
    };
    const fileName =
      typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
    const fileType = typeof body.fileType === "string" ? body.fileType : "";
    if (!(fileName.toLowerCase().endsWith(".xlsx") && fileSize > 0)) {
      return NextResponse.json(
        { error: "Select a non-empty .xlsx file." },
        { status: 400 }
      );
    }
    if (fileSize > MAX_IMPORT_BYTES) {
      return NextResponse.json(
        { error: "The workbook exceeds the 10 MiB limit." },
        { status: 400 }
      );
    }
    if (
      fileType &&
      fileType !== xlsxMime &&
      fileType !== "application/octet-stream"
    ) {
      return NextResponse.json(
        { error: "The selected file is not an Excel workbook." },
        { status: 400 }
      );
    }
    const studentImport = await database.studentImport.create({
      data: {
        organizationId: tenant.organizationId,
        createdByUserId: tenant.userId,
        filename: fileName.slice(0, 255),
        fileSize,
      },
      select: { id: true },
    });
    const key = `student-imports/${tenant.organizationId}/${studentImport.id}/${randomUUID()}.xlsx`;
    const upload = await createPresignedUploadUrl({
      bucket: "private",
      key,
      contentType: xlsxMime,
    });
    await database.studentImport.update({
      where: { id: studentImport.id },
      data: { sourceKey: key },
    });
    console.info("Student import created", {
      importId: studentImport.id,
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      filename: fileName,
    });
    return NextResponse.json({
      importId: studentImport.id,
      key,
      uploadUrl: upload.uploadUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to prepare the import upload." },
      { status: 500 }
    );
  }
};
