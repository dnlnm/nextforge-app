import { currentUser } from "@repo/auth/server";
import { put } from "@repo/storage";
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

    const formData = await request.formData();
    const logo = formData.get("logo");

    if (!(logo instanceof File) || logo.size === 0) {
      return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    }

    if (logo.size > maxLogoSizeBytes) {
      return NextResponse.json(
        { error: "Logo must be 2MB or smaller." },
        { status: 400 }
      );
    }

    const pathname = `centre-logos/${crypto.randomUUID()}-${sanitizeFileName(logo.name)}`;
    const { url } = await put(pathname, logo, {
      access: "public",
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
