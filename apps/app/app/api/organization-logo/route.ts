import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { NextResponse } from "next/server";

const resolveOrganizationLogo = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const activeOrganizationId = user.user_metadata?.activeOrganizationId as
    | string
    | undefined;

  if (activeOrganizationId) {
    const organization = await database.organization.findFirst({
      where: { id: activeOrganizationId, status: "ACTIVE" },
      select: { imageUrl: true },
    });

    if (organization?.imageUrl) {
      return organization.imageUrl;
    }
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organization: { status: "ACTIVE" },
      status: "ACTIVE",
      user: { authUserId: user.id, archivedAt: null },
    },
    orderBy: { createdAt: "asc" },
    select: { organization: { select: { imageUrl: true } } },
  });

  return membership?.organization.imageUrl ?? null;
};

export const GET = async () => {
  const imageUrl = await resolveOrganizationLogo();

  if (!imageUrl) {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }

  const response = await fetch(imageUrl);

  if (!(response.ok && response.body)) {
    return NextResponse.json({ error: "Logo unavailable" }, { status: 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": response.headers.get("content-type") ?? "image/png",
    },
  });
};
