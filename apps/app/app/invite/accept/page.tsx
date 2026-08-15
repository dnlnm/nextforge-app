import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { isExpired } from "@repo/date";
import type { InvitationKind } from "../actions";
import { InviteAcceptClient } from "./invite-accept-client";

interface InviteAcceptPageProps {
  readonly searchParams: Promise<{ token?: string }>;
}

const InviteAcceptPage = async ({ searchParams }: InviteAcceptPageProps) => {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return <InviteAcceptClient state="invalid" />;
  }

  const [teacherInvitation, adminInvitation] = await Promise.all([
    database.teacherInvitation.findFirst({
      where: { token, status: "PENDING" },
      select: {
        email: true,
        expiresAt: true,
        fullName: true,
        Organization: { select: { name: true, status: true } },
      },
    }),
    database.adminInvitation.findFirst({
      where: { token, status: "PENDING" },
      select: {
        email: true,
        expiresAt: true,
        fullName: true,
        Organization: { select: { name: true, status: true } },
      },
    }),
  ]);

  const invitation = teacherInvitation ?? adminInvitation;
  let invitationKind: InvitationKind | null = null;

  if (teacherInvitation) {
    invitationKind = "TEACHER";
  } else if (adminInvitation) {
    invitationKind = "ADMIN";
  }

  if (invitation && isExpired(invitation.expiresAt)) {
    await database.teacherInvitation.updateMany({
      where: { token },
      data: { status: "EXPIRED" },
    });
    await database.adminInvitation.updateMany({
      where: { token },
      data: { status: "EXPIRED" },
    });
  }

  if (!(invitation && invitationKind)) {
    return <InviteAcceptClient state="invalid" />;
  }

  if (invitation.Organization.status !== "ACTIVE") {
    return <InviteAcceptClient state="error" />;
  }

  const user = await currentUser();
  const signedInEmail = user?.email?.toLowerCase();

  return (
    <InviteAcceptClient
      email={invitation.email}
      fullName={invitation.fullName}
      invitationKind={invitationKind}
      organizationName={invitation.Organization.name}
      signedInEmail={signedInEmail}
      token={token}
    />
  );
};

export default InviteAcceptPage;
