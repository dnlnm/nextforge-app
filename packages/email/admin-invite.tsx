import { appName } from "@repo/config/brand";
import "server-only";

import { resend } from "./index";
import { keys } from "./keys";
import { AdminInviteTemplate } from "./templates/admin-invite";

interface SendAdminInviteOptions {
  readonly actionUrl: string;
  readonly inviteeEmail: string;
  readonly inviteeName: string;
  readonly organizationName: string;
}

export const sendAdminInvitation = async ({
  actionUrl,
  inviteeEmail,
  inviteeName,
  organizationName,
}: SendAdminInviteOptions) => {
  if (!resend) {
    return;
  }

  const { RESEND_FROM } = keys();

  if (!RESEND_FROM) {
    return;
  }

  await resend.emails.send({
    from: RESEND_FROM,
    to: inviteeEmail,
    subject: `You've been invited as an Admin to ${organizationName} on ${appName}`,
    react: (
      <AdminInviteTemplate
        actionUrl={actionUrl}
        inviteeName={inviteeName}
        organizationName={organizationName}
      />
    ),
  });
};
