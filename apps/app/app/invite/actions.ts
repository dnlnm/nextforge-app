"use server";

import { ensureLocalUser, switchOrganization } from "@repo/auth/organizations";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { isExpired } from "@repo/date";
import { revalidatePath } from "next/cache";

const formatCode = (prefix: string, sequence: number) =>
  `${prefix}${String(sequence).padStart(4, "0")}`;

export type InvitationKind = "TEACHER" | "ADMIN";

export type AcceptInvitationResult =
  | { error: string; status: "error" }
  | { status: "no-session" }
  | { status: "success" };

export const acceptInvitation = async (
  token: string,
  kind: InvitationKind
): Promise<AcceptInvitationResult> => {
  const invitation =
    kind === "TEACHER"
      ? await database.teacherInvitation.findFirst({
          where: { token, status: "PENDING" },
          select: {
            email: true,
            expiresAt: true,
            fullName: true,
            id: true,
            organizationId: true,
            Organization: { select: { name: true, status: true } },
          },
        })
      : await database.adminInvitation.findFirst({
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

  if (isExpired(invitation.expiresAt)) {
    if (kind === "TEACHER") {
      await database.teacherInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    } else {
      await database.adminInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }

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

  const role = kind === "TEACHER" ? "TEACHER" : "ADMIN";

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
      role,
      status: "ACTIVE",
    },
    update: {
      role,
      status: "ACTIVE",
      archivedAt: null,
    },
  });

  if (kind === "TEACHER") {
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
  } else {
    await database.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByUserId: localUser.id,
      },
    });
  }

  await switchOrganization(invitation.organizationId);

  revalidatePath("/today");
  revalidatePath("/teachers");
  revalidatePath("/members");

  return { status: "success" };
};
