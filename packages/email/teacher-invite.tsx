import "server-only";

import { resend } from "./index";
import { keys } from "./keys";
import { TeacherInviteTemplate } from "./templates/teacher-invite";

interface SendTeacherInviteOptions {
  readonly actionUrl: string;
  readonly inviteeEmail: string;
  readonly inviteeName: string;
  readonly organizationName: string;
}

export const sendTeacherInvitation = async ({
  actionUrl,
  inviteeEmail,
  inviteeName,
  organizationName,
}: SendTeacherInviteOptions) => {
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
    subject: `You've been invited to join ${organizationName} on TLAS.MY`,
    react: (
      <TeacherInviteTemplate
        actionUrl={actionUrl}
        inviteeName={inviteeName}
        organizationName={organizationName}
      />
    ),
  });
};
