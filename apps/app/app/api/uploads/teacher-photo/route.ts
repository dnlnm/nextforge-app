import { requireTenantRole } from "@repo/auth/authorization";
import { createPresignedUploadUrl } from "@repo/storage";
import { NextResponse } from "next/server";

const maxPhotoSizeBytes = 512 * 1024;

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
        { error: "Photo details are required" },
        { status: 400 }
      );
    }

    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Photo must be an image." },
        { status: 400 }
      );
    }

    if (fileSize > maxPhotoSizeBytes) {
      return NextResponse.json(
        { error: "Photo must be 0.5MB or smaller." },
        { status: 400 }
      );
    }

    const key = `teacher-photos/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
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
