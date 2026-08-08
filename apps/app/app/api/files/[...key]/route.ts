import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { getPrivateObject } from "@repo/storage";
import { NextResponse } from "next/server";

const isValidKey = (key: string) =>
  key.length > 0 && !key.startsWith("/") && !key.includes("..");

// Streams a private R2 object to an authenticated user who belongs to at least
// one active tenant. This is the single read path for private files (student
// photos, future documents). Private objects are never publicly addressable.
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) => {
  const session = await auth();

  if (!session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
      user: { authUserId: session.userId, archivedAt: null },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { key: segments } = await params;
  const key = segments.join("/");

  if (!isValidKey(key)) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
  }

  try {
    const object = await getPrivateObject(key);

    if (!object.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(object.Body.transformToWebStream(), {
      headers: {
        "cache-control": "private, no-store",
        "content-type": object.ContentType ?? "application/octet-stream",
        ...(object.ContentLength
          ? { "content-length": String(object.ContentLength) }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
};
