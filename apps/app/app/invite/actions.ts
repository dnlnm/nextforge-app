"use server";

import { ensureLocalUser, switchOrganization } from "@repo/auth/organizations";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";

const formatCode = (prefix: string, sequence: number) =>
  `${prefix}${String(sequence).padStart(4, "0")}`;

export type AcceptInvitationResult =
  | { error: string; status: "error" }
  | { status: "no-session" }
  | { status: "success" };

export const acceptInvitation = async (
  token: string
): Promise<AcceptInvitationResult> => {
  const invitation = await database.teacherInvitation.findFirst({
    where: { token, status: "PENDING" },
    select: {
      email: true,
      expiresAt: true,
      fullName: true,
      id: true,
      organizationId: true,
      Organization: { select: { name: true, status: true } },
    },
  });

  if (!invitation) {
    return {
      error:
        "This invitation is no longer valid. Ask your admin to send a new one.",
      status: "error",
    };
  }

  if (invitation.Organization.status !== "ACTIVE") {
    return {
      error: "This centre is no longer active.",
      status: "error",
    };
  }

  if (invitation.expiresAt <= new Date()) {
    await database.teacherInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });

    return {
      error: "This invitation has expired. Ask your admin to send a new one.",
      status: "error",
    };
  }

  const user = await currentUser();

  if (!user) {
    return { status: "no-session" };
  }

  if ((user.email ?? "").toLowerCase() !== invitation.email) {
    return {
      error: `This invitation is for ${invitation.email}. Sign in with that email address to accept it.`,
      status: "error",
    };
  }

  const localUser = await ensureLocalUser();

  if (!localUser) {
    return { status: "no-session" };
  }

  await database.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId: localUser.id,
      },
    },
    create: {
      organizationId: invitation.organizationId,
      userId: localUser.id,
      role: "TEACHER",
      status: "ACTIVE",
    },
    update: {
      role: "TEACHER",
      status: "ACTIVE",
      archivedAt: null,
    },
  });

  const existingProfile = await database.teacherProfile.findFirst({
    where: {
      organizationId: invitation.organizationId,
      email: { equals: invitation.email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existingProfile) {
    await database.teacherProfile.update({
      where: { id: existingProfile.id },
      data: { archivedAt: null, userId: localUser.id },
    });
  } else {
    const count = await database.teacherProfile.count({
      where: { organizationId: invitation.organizationId },
    });

    await database.teacherProfile.create({
      data: {
        organizationId: invitation.organizationId,
        email: invitation.email,
        fullName: invitation.fullName,
        code: formatCode("TCH", count + 1),
        userId: localUser.id,
      },
    });
  }

  await database.teacherInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedByUserId: localUser.id,
    },
  });

  await switchOrganization(invitation.organizationId);

  revalidatePath("/today");
  revalidatePath("/teachers");

  return { status: "success" };
};
