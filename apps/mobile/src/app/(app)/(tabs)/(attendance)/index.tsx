import { useRouter } from "expo-router";
import { Button, Chip, Spinner, Typography } from "heroui-native";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";
import { trpc } from "@/lib/trpc";

export default function AttendanceScreen() {
  const router = useRouter();
  const { activeMembership } = useOrganization();
  const { data, error, isLoading } = trpc.today.sessions.useQuery(
    {},
    { enabled: Boolean(activeMembership) }
  );
  const createSessions = trpc.today.createSessions.useMutation();

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load attendance", error.message);
    }
  }, [error]);

  const isComplete = (sessionId: string) => {
    const session = data?.sessions.find(
      (candidate) => candidate.id === sessionId
    );
    return session
      ? session.attendance.length >= session.class.enrollments.length &&
          session.attendance.length > 0
      : false;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <Typography.Heading type="h2">Attendance</Typography.Heading>

        {data?.sessions.length === 0 ? (
          <View className="gap-3">
            <Typography.Paragraph color="muted" type="body-sm">
              No classes to take attendance for today.
            </Typography.Paragraph>
            <Button
              isDisabled={createSessions.isPending}
              onPress={() => createSessions.mutateAsync()}
            >
              Create today&apos;s sessions
            </Button>
          </View>
        ) : (
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
                    <Chip
                      size="sm"
                      variant={isComplete(session.id) ? "primary" : "soft"}
                    >
                      {isComplete(session.id) ? "Completed" : "Pending"}
                    </Chip>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Typography.Paragraph color="muted" type="body-sm">
                      {session.startsAt} – {session.endsAt}
                    </Typography.Paragraph>
                    <Typography.Paragraph color="muted" type="body-sm">
                      {session.attendance.length}/
                      {session.class.enrollments.length} marked
                    </Typography.Paragraph>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
