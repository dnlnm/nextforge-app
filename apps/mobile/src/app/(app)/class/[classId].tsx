import { getMalaysiaCalendarDate } from "@repo/date";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, Spinner, Typography } from "heroui-native";
import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";

export default function ClassDetailScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { data, error, isLoading } = trpc.classes.get.useQuery(
    { classId: classId ?? "" },
    { enabled: Boolean(classId) }
  );
  const createSession = trpc.today.createClassSession.useMutation();

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load class", error.message);
    }
  }, [error]);

  const handleTakeAttendance = async () => {
    if (!data) {
      return;
    }
    const today = getMalaysiaCalendarDate();
    try {
      await createSession.mutateAsync({
        classId: data.id,
        sessionDate: today,
      });
      const sessions = await trpcClient.today.sessions.query({});
      const session = sessions.sessions.find(
        (candidate) => candidate.class.id === data.id
      );
      if (session) {
        router.push({
          pathname: "/session/[sessionId]",
          params: { sessionId: session.id },
        });
      } else {
        Alert.alert("Created", "Session created. Pull to refresh Today.");
      }
    } catch (createError) {
      Alert.alert(
        "Could not create a session for today",
        createError instanceof Error
          ? createError.message
          : "This class may not be scheduled today."
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <View className="gap-1">
          <Typography.Heading type="h2">{data.name}</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {data.code} · {data.subject?.name ?? "No subject"}
            {data.teacher?.fullName ? ` · ${data.teacher.fullName}` : ""}
          </Typography.Paragraph>
        </View>

        <Button
          isDisabled={createSession.isPending}
          onPress={handleTakeAttendance}
          variant="primary"
        >
          Take attendance today
        </Button>

        <View>
          <Typography.Heading type="h3">Students</Typography.Heading>
        </View>
        <View className="gap-2">
          {data.enrollments.length === 0 ? (
            <Typography.Paragraph color="muted" type="body-sm">
              No students enrolled yet.
            </Typography.Paragraph>
          ) : (
            data.enrollments.map((enrollment) => (
              <View
                className="rounded-lg border border-border bg-card p-4"
                key={enrollment.id}
              >
                <Typography.Paragraph type="body">
                  {enrollment.student.fullName}
                </Typography.Paragraph>
                <Typography.Paragraph color="muted" type="body-sm">
                  {enrollment.student.code}
                </Typography.Paragraph>
              </View>
            ))
          )}
        </View>

        <View className="gap-3 pt-2">
          <Typography.Heading type="h3">Schedule</Typography.Heading>
          {data.schedules.map((schedule) => (
            <View
              className="rounded-lg border border-border bg-card p-4"
              key={schedule.id}
            >
              <View className="flex-row items-center justify-between">
                <Chip size="sm" variant="soft">
                  {schedule.dayOfWeek}
                </Chip>
                <Typography.Paragraph type="body-sm">
                  {schedule.startsAt} – {schedule.endsAt}
                  {schedule.room?.name ? ` · ${schedule.room.name}` : ""}
                </Typography.Paragraph>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
