import { currentUser } from "@repo/auth/server";
import { createPresignedUploadUrl } from "@repo/storage";
import { NextResponse } from "next/server";

const maxLogoSizeBytes = 2 * 1024 * 1024;

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-");

export const POST = async (request: Request) => {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { fileName, fileType, fileSize } = (await request.json()) as {
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    };

    if (!(fileName && fileType) || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "Logo details are required" },
        { status: 400 }
      );
    }

    if (fileSize > maxLogoSizeBytes) {
      return NextResponse.json(
        { error: "Logo must be 2MB or smaller." },
        { status: 400 }
      );
    }

    const key = `centre-logos/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
    const upload = await createPresignedUploadUrl({
      bucket: "public",
      key,
      contentType: fileType,
    });

    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
