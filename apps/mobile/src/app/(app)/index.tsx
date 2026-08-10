import { Button, Spinner, Typography } from "heroui-native";
import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";
import { useSession } from "@/lib/session-provider";
import { trpc } from "@/lib/trpc";

export default function TodayScreen() {
  const { user, signOut } = useSession();
  const { activeMembership } = useOrganization();
  const { data, error, isFetching, isLoading } = trpc.today.sessions.useQuery(
    {},
    { enabled: Boolean(activeMembership) }
  );

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load sessions", error.message);
    }
  }, [error]);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-6 px-6 py-6">
        <View className="gap-1">
          <Typography.Heading type="h2">Welcome back</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {user?.email}
          </Typography.Paragraph>
        </View>

        {isLoading ? (
          <View className="items-center py-10">
            <Spinner size="lg" />
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-between">
              <Typography.Heading type="h3">
                Today&apos;s sessions
              </Typography.Heading>
              {isFetching ? (
                <Typography.Paragraph color="muted" type="body-sm">
                  Refreshing…
                </Typography.Paragraph>
              ) : null}
            </View>
            {data?.sessions.length === 0 ? (
              <Typography.Paragraph color="muted" type="body-sm">
                No sessions today.
              </Typography.Paragraph>
            ) : null}
            {data?.sessions.map((session) => (
              <View
                className="rounded-lg border border-border bg-card p-4"
                key={session.id}
              >
                <Typography.Paragraph type="body">
                  {session.class.subject?.name ?? "Class"}
                </Typography.Paragraph>
                <Typography.Paragraph color="muted" type="body-sm">
                  {session.startsAt} – {session.endsAt} ·{" "}
                  {session.class.teacher?.fullName}
                </Typography.Paragraph>
              </View>
            ))}
          </>
        )}

        <View className="gap-1 pt-4">
          {data?.todayClassCount !== undefined ? (
            <Typography.Paragraph color="muted" type="body-sm">
              {data.todayClassCount} scheduled class
              {data.todayClassCount === 1 ? "" : "es"} today
            </Typography.Paragraph>
          ) : null}
        </View>

        <View className="gap-1 pt-2">
          <Typography.Paragraph color="muted" type="body-sm">
            Sessions load securely for {activeMembership?.organization.name}.
          </Typography.Paragraph>
        </View>

        <Button onPress={signOut} variant="danger-soft">
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}
