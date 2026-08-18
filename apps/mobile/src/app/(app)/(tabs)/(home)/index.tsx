import { useRouter } from "expo-router";
import { Button, Chip, Spinner, Typography } from "heroui-native";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";
import { useSession } from "@/lib/session-provider";
import { trpc } from "@/lib/trpc";

const useMutation = trpc.today.createSessions.useMutation;

export default function TodayScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const { activeMembership } = useOrganization();
  const { data, error, isFetching, isLoading, refetch } =
    trpc.today.sessions.useQuery({}, { enabled: Boolean(activeMembership) });
  const createSessions = useMutation();

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load sessions", error.message);
    }
  }, [error]);

  const handleCreateSessions = async () => {
    try {
      await createSessions.mutateAsync();
      await refetch();
    } catch (createError) {
      Alert.alert(
        "Could not create sessions",
        createError instanceof Error ? createError.message : "Please try again."
      );
    }
  };

  const markedCount = (sessionId: string) =>
    data?.sessions.find((session) => session.id === sessionId)?.attendance
      .length ?? 0;

  const rosterCount = (sessionId: string) =>
    data?.sessions.find((session) => session.id === sessionId)?.class
      .enrollments.length ?? 0;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <View className="gap-1">
          <Typography.Heading type="h2">Today</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {user?.email} · {activeMembership?.organization.name}
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
                Today&apos;s classes
              </Typography.Heading>
              {isFetching ? (
                <Typography.Paragraph color="muted" type="body-sm">
                  Refreshing…
                </Typography.Paragraph>
              ) : null}
            </View>

            {data?.sessions.length === 0 ? (
              <View className="gap-3">
                <Typography.Paragraph color="muted" type="body-sm">
                  No classes today.
                </Typography.Paragraph>
                <Button
                  isDisabled={createSessions.isPending}
                  onPress={handleCreateSessions}
                >
                  Create today&apos;s sessions
                </Button>
              </View>
            ) : null}

            <View className="gap-3">
              {data?.sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() =>
                    router.push({
                      pathname: "/session/[sessionId]",
                      params: { sessionId: session.id },
                    })
                  }
                >
                  <View className="rounded-lg border border-border bg-card p-4">
                    <View className="flex-row items-center justify-between">
                      <Typography.Paragraph type="body">
                        {session.class.subject?.name ??
                          session.class.name ??
                          "Class"}
                      </Typography.Paragraph>
                      <Chip size="sm" variant="soft">
                        {session.startsAt} – {session.endsAt}
                      </Chip>
                    </View>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Typography.Paragraph color="muted" type="body-sm">
                        {session.class.teacher?.fullName ?? "No teacher"}
                      </Typography.Paragraph>
                      <Typography.Paragraph color="muted" type="body-sm">
                        {markedCount(session.id)}/{rosterCount(session.id)}{" "}
                        marked
                      </Typography.Paragraph>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View className="gap-1 pt-2">
          <Typography.Paragraph color="muted" type="body-sm">
            {data?.todayClassCount ?? 0} scheduled class
            {data?.todayClassCount === 1 ? "" : "es"} today
          </Typography.Paragraph>
        </View>

        <Button onPress={signOut} variant="danger-soft">
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}
