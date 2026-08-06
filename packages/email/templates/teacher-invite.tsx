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

interface TeacherInviteTemplateProps {
  readonly actionUrl: string;
  readonly expiresInDays?: number;
  readonly inviteeName: string;
  readonly organizationName: string;
}

export const TeacherInviteTemplate = ({
  actionUrl,
  expiresInDays = 7,
  inviteeName,
  organizationName,
}: TeacherInviteTemplateProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>
        You&apos;ve been invited to join {organizationName} on TLAS.MY
      </Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                You&apos;ve been invited to join {organizationName}
              </Text>
              <Text className="m-0 text-zinc-500">Hi {inviteeName},</Text>
              <Text className="m-0 text-zinc-500">
                {organizationName} has invited you to be a teacher on TLAS.MY.
                Follow the link below to accept the invitation and sign in.
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
                don&apos;t have a TLAS.MY account yet, you can create one with
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

TeacherInviteTemplate.PreviewProps = {
  actionUrl: "https://app.tlas.my/invite/accept?token=example",
  expiresInDays: 7,
  inviteeName: "Ahmad Hakimi",
  organizationName: "Terengganu Tuition Centre",
};

export default TeacherInviteTemplate;
