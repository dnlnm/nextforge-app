import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
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

  const invitation = await database.teacherInvitation.findFirst({
    where: { token, status: "PENDING" },
    select: {
      email: true,
      expiresAt: true,
      fullName: true,
      Organization: { select: { name: true, status: true } },
    },
  });

  if (invitation && invitation.expiresAt <= new Date()) {
    await database.teacherInvitation.updateMany({
      where: { token },
      data: { status: "EXPIRED" },
    });
  }

  if (!invitation) {
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
      organizationName={invitation.Organization.name}
      signedInEmail={signedInEmail}
      token={token}
    />
  );
};

export default InviteAcceptPage;
