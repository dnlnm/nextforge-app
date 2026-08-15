"use server";

import { randomBytes } from "node:crypto";
import { requireTenantRole } from "@repo/auth/authorization";
import { buildWorkspaceUrl } from "@repo/auth/domain";
import { database } from "@repo/database";
import {
  addMalaysiaCalendarDays,
  differenceInMalaysiaCalendarDays,
} from "@repo/date";
import { sendAdminInvitation } from "@repo/email/admin-invite";
import { revalidatePath } from "next/cache";
import { assertAdminWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmail = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return EMAIL_PATTERN.test(normalized) ? normalized : undefined;
};

const INVITATION_TTL_DAYS = 7;

export const inviteAdmin = async (formData: FormData) => {
  const tenant = await requireTenantRole(["OWNER"]);
  const fullName = getString(formData, "fullName");
  const email = parseEmail(getString(formData, "email"));

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!email) {
    throw new Error("A valid email address is required.");
  }

  await assertAdminWithinPlanLimit({
    organizationId: tenant.organizationId,
    userId: tenant.authUserId,
  });

  const existing = await database.adminInvitation.findFirst({
    where: { organizationId: tenant.organizationId, email, status: "PENDING" },
    select: { id: true },
  });

  if (existing) {
    throw new Error("An admin with this email has already been invited.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = addMalaysiaCalendarDays(
    new Date(),
    INVITATION_TTL_DAYS
  );

  const [organization, reusableInvitation] = await Promise.all([
    database.organization.findFirst({
      where: { id: tenant.organizationId },
      select: { name: true, slug: true },
    }),
    database.adminInvitation.findFirst({
      where: {
        organizationId: tenant.organizationId,
        email,
        status: { in: ["REVOKED", "EXPIRED"] },
      },
      select: { id: true },
    }),
  ]);

  const invitation = reusableInvitation
    ? await database.adminInvitation.update({
        where: { id: reusableInvitation.id },
        data: {
          fullName,
          token,
          expiresAt,
          invitedByUserId: tenant.userId,
          status: "PENDING",
          acceptedByUserId: null,
          acceptedAt: null,
          revokedAt: null,
        },
        select: { token: true },
      })
    : await database.adminInvitation.create({
        data: {
          organizationId: tenant.organizationId,
          email,
          fullName,
          token,
          expiresAt,
          invitedByUserId: tenant.userId,
        },
        select: { token: true },
      });

  const actionUrl = organization?.slug
    ? buildWorkspaceUrl(
        organization.slug,
        `/invite/accept?token=${invitation.token}`
      )
    : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/accept?token=${invitation.token}`;

  await sendAdminInvitation({
    actionUrl,
    inviteeEmail: email,
    inviteeName: fullName,
    organizationName: organization?.name ?? "your centre",
  });

  revalidatePath("/members");
};

export const revokeAdminInvitation = async (formData: FormData) => {
  const tenant = await requireTenantRole(["OWNER"]);
  const invitationId = getString(formData, "invitationId");

  if (!invitationId) {
    throw new Error("Invitation is required.");
  }

  const invitation = await database.adminInvitation.findFirst({
    where: { id: invitationId, organizationId: tenant.organizationId },
    select: { email: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  await database.adminInvitation.deleteMany({
    where: {
      organizationId: tenant.organizationId,
      email: invitation.email,
      status: { in: ["REVOKED", "EXPIRED"] },
    },
  });

  await database.adminInvitation.updateMany({
    where: {
      id: invitationId,
      organizationId: tenant.organizationId,
      status: "PENDING",
    },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  revalidatePath("/members");
};

export const getPendingAdminInvitations = async () => {
  const tenant = await requireTenantRole(["OWNER"]);

  const now = new Date();
  // Remove any stale EXPIRED rows for these emails first so the unique
  // (organizationId, email, status) constraint is not violated when
  // PENDING invitations transition to EXPIRED below.
  const expiring = await database.adminInvitation.findMany({
    where: {
      organizationId: tenant.organizationId,
      status: "PENDING",
      expiresAt: { lte: now },
    },
    select: { email: true },
  });
  const expiringEmails = Array.from(
    new Set(expiring.map((invitation) => invitation.email))
  );

  if (expiringEmails.length > 0) {
    await database.adminInvitation.deleteMany({
      where: {
        organizationId: tenant.organizationId,
        email: { in: expiringEmails },
        status: "EXPIRED",
      },
    });
  }

  await database.adminInvitation.updateMany({
    where: {
      organizationId: tenant.organizationId,
      status: "PENDING",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const invitations = await database.adminInvitation.findMany({
    where: { organizationId: tenant.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      email: true,
      expiresAt: true,
      fullName: true,
      id: true,
    },
  });

  return invitations.map((invitation) => ({
    ...invitation,
    expiresInDays: Math.max(
      0,
      differenceInMalaysiaCalendarDays(invitation.expiresAt, now)
    ),
  }));
};

export const getAdminMembers = async () => {
  const tenant = await requireTenantRole(["OWNER"]);

  const members = await database.organizationMembership.findMany({
    where: {
      organizationId: tenant.organizationId,
      role: { in: ["OWNER", "ADMIN"] },
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          imageUrl: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members.map((member) => ({
    createdAt: member.createdAt,
    email: member.user.email,
    firstName: member.user.firstName,
    fullName: [member.user.firstName, member.user.lastName]
      .filter(Boolean)
      .join(" "),
    id: member.id,
    imageUrl: member.user.imageUrl,
    lastName: member.user.lastName,
    role: member.role,
  }));
};
