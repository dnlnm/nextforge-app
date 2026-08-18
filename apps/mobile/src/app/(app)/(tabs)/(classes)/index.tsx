import { useRouter } from "expo-router";
import { Chip, Spinner, Typography } from "heroui-native";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";
import { trpc } from "@/lib/trpc";

export default function ClassesScreen() {
  const router = useRouter();
  const { activeMembership } = useOrganization();
  const { data, error, isLoading } = trpc.classes.list.useQuery(
    {},
    { enabled: Boolean(activeMembership) }
  );

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load classes", error.message);
    }
  }, [error]);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <Typography.Heading type="h2">My classes</Typography.Heading>

        {isLoading ? (
          <View className="items-center py-10">
            <Spinner size="lg" />
          </View>
        ) : data?.data.length === 0 ? (
          <Typography.Paragraph color="muted" type="body-sm">
            No classes yet.
          </Typography.Paragraph>
        ) : (
          <View className="gap-3">
            {data?.data.map((klass) => (
              <Pressable
                key={klass.id}
                onPress={() =>
                  router.push({
                    pathname: "/class/[classId]",
                    params: { classId: klass.id },
                  })
                }
              >
                <View className="rounded-lg border border-border bg-card p-4">
                  <View className="flex-row items-center justify-between">
                    <Typography.Paragraph type="body">
                      {klass.name}
                    </Typography.Paragraph>
                    <Chip size="sm" variant="soft">
                      {klass.studentCount} students
                    </Chip>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Typography.Paragraph color="muted" type="body-sm">
                      {klass.subject?.name ?? "No subject"}
                      {klass.teacher?.fullName
                        ? ` · ${klass.teacher.fullName}`
                        : ""}
                    </Typography.Paragraph>
                    <Typography.Paragraph color="muted" type="body-sm">
                      {klass.schedules?.[0]
                        ? `${klass.schedules[0].dayOfWeek} ${klass.schedules[0].startsAt}`
                        : "No schedule"}
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
