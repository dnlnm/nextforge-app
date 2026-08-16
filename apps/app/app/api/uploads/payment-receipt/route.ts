import { requireTenantRole } from "@repo/auth/authorization";
import { createPresignedUploadUrl } from "@repo/storage";
import { NextResponse } from "next/server";

const maxReceiptSizeBytes = 10 * 1024 * 1024;

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-");

export const POST = async (request: Request) => {
  try {
    await requireTenantRole(["ADMIN"]);

    const { fileName, fileType, fileSize } = (await request.json()) as {
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    };

    if (!(fileName && fileType) || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "File details are required" },
        { status: 400 }
      );
    }

    const isImage = fileType.startsWith("image/");
    const isPdf = fileType === "application/pdf";

    if (!(isImage || isPdf)) {
      return NextResponse.json(
        { error: "Receipts must be an image or PDF." },
        { status: 400 }
      );
    }

    if (fileSize > maxReceiptSizeBytes) {
      return NextResponse.json(
        { error: "Receipts must be 10MB or smaller." },
        { status: 400 }
      );
    }

    const key = `payment-receipts/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
    const upload = await createPresignedUploadUrl({
      bucket: "private",
      key,
      contentType: fileType,
    });

    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
