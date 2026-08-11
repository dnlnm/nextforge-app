import { useLocalSearchParams } from "expo-router";
import { Button, Chip, Spinner, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { trpc } from "@/lib/trpc";

type Status = "PRESENT" | "ABSENT";

export default function SessionAttendanceScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data, error, isLoading } = trpc.attendance.session.useQuery(
    { sessionId: sessionId ?? "" },
    { enabled: Boolean(sessionId) }
  );
  const markAttendance = trpc.attendance.markAttendance.useMutation();
  const [records, setRecords] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (data) {
      const initial: Record<string, Status> = {};
      for (const entry of data.roster) {
        initial[entry.student.id] =
          entry.attendanceStatus === "PRESENT" ? "PRESENT" : "ABSENT";
      }
      setRecords(initial);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load attendance", error.message);
    }
  }, [error]);

  const handleSave = async () => {
    if (!data) {
      return;
    }
    try {
      await markAttendance.mutateAsync({
        sessionId: data.id,
        records: data.roster.map((entry) => ({
          studentId: entry.student.id,
          status: records[entry.student.id] ?? "ABSENT",
        })),
      });
      Alert.alert("Saved", "Attendance has been saved.");
    } catch (saveError) {
      Alert.alert(
        "Could not save attendance",
        saveError instanceof Error ? saveError.message : "Please try again."
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

  const presentCount = Object.values(records).filter(
    (status) => status === "PRESENT"
  ).length;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <View className="gap-1">
          <Typography.Heading type="h2">{data.class.name}</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {data.startsAt} – {data.endsAt} · {presentCount}/
            {data.roster.length} present
          </Typography.Paragraph>
        </View>

        <View className="gap-2">
          {data.roster.map((entry) => {
            const isPresent = records[entry.student.id] === "PRESENT";
            return (
              <Pressable
                key={entry.student.id}
                onPress={() =>
                  setRecords((current) => ({
                    ...current,
                    [entry.student.id]: isPresent ? "ABSENT" : "PRESENT",
                  }))
                }
              >
                <View
                  className={`flex-row items-center justify-between rounded-lg border p-4 ${
                    isPresent
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <View className="flex-1 gap-0.5">
                    <Typography.Paragraph type="body">
                      {entry.student.fullName}
                    </Typography.Paragraph>
                    <Typography.Paragraph color="muted" type="body-sm">
                      {entry.student.code}
                    </Typography.Paragraph>
                  </View>
                  <Chip size="sm" variant={isPresent ? "primary" : "soft"}>
                    {isPresent ? "Present" : "Absent"}
                  </Chip>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button
          isDisabled={markAttendance.isPending}
          onPress={handleSave}
          variant="primary"
        >
          Save attendance
        </Button>
      </View>
    </ScrollView>
  );
}
