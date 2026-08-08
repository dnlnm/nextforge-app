import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { appName, buildAppUrl } from "@repo/config/brand";

interface AdminInviteTemplateProps {
  readonly actionUrl: string;
  readonly expiresInDays?: number;
  readonly inviteeName: string;
  readonly organizationName: string;
}

export const AdminInviteTemplate = ({
  actionUrl,
  expiresInDays = 7,
  inviteeName,
  organizationName,
}: AdminInviteTemplateProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>
        You&apos;ve been invited as an Admin to {organizationName} on {appName}
      </Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                You&apos;ve been invited as an Admin to {organizationName}
              </Text>
              <Text className="m-0 text-zinc-500">Hi {inviteeName},</Text>
              <Text className="m-0 text-zinc-500">
                {organizationName} has invited you to be an Admin on {appName}.
                As an Admin you&apos;ll help manage students, teachers, classes,
                and invoicing for the centre. Follow the link below to accept
                the invitation and sign in.
              </Text>
              <Section className="my-8 text-center">
                <Button
                  className="rounded-md bg-zinc-950 px-6 py-3 font-medium text-sm text-white"
                  href={actionUrl}
                >
                  Accept invitation
                </Button>
              </Section>
              <Text className="m-0 text-zinc-500">
                This invitation expires in {expiresInDays} days. If you
                don&apos;t have a {appName} account yet, you can create one with
                the same email address, then follow the link.
              </Text>
              <Text className="mt-8 mb-0 text-xs text-zinc-400">
                If you weren&apos;t expecting this invite, you can ignore this
                email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

AdminInviteTemplate.PreviewProps = {
  actionUrl: buildAppUrl("/invite/accept?token=example"),
  expiresInDays: 7,
  inviteeName: "Ahmad Hakimi",
  organizationName: "Terengganu Tuition Centre",
};

export default AdminInviteTemplate;
