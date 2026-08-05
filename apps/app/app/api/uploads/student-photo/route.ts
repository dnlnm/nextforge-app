import { requireTenantRole } from "@repo/auth/authorization";
import { put } from "@repo/storage";
import { NextResponse } from "next/server";

const maxPhotoSizeBytes = 2 * 1024 * 1024;

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-");

export const POST = async (request: Request) => {
  try {
    await requireTenantRole(["ADMIN"]);

    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Photo must be an image." },
        { status: 400 }
      );
    }

    if (photo.size > maxPhotoSizeBytes) {
      return NextResponse.json(
        { error: "Photo must be 2MB or smaller." },
        { status: 400 }
      );
    }

    const pathname = `student-photos/${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
    const { url } = await put(pathname, photo, {
      access: "public",
      contentType: photo.type,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
