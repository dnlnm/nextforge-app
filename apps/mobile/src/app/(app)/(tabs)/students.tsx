import { Input, Spinner, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useOrganization } from "@/lib/organization-provider";
import { trpc } from "@/lib/trpc";

export default function StudentsScreen() {
  const { activeMembership } = useOrganization();
  const [search, setSearch] = useState("");
  const { data, error, isFetching, isLoading } = trpc.students.list.useQuery(
    { page: 0, pageSize: 50, search: search || undefined },
    { enabled: Boolean(activeMembership) }
  );

  useEffect(() => {
    if (error) {
      Alert.alert("Couldn't load students", error.message);
    }
  }, [error]);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-5 px-5 py-5">
        <Typography.Heading type="h2">Students</Typography.Heading>

        <Input
          onChangeText={setSearch}
          placeholder="Search by name or school"
          value={search}
        />

        {isLoading ? (
          <View className="items-center py-10">
            <Spinner size="lg" />
          </View>
        ) : isFetching && search ? (
          <View className="items-center py-6">
            <Spinner size="sm" />
          </View>
        ) : data?.data.length === 0 ? (
          <Typography.Paragraph color="muted" type="body-sm">
            {search ? "No students match your search." : "No students yet."}
          </Typography.Paragraph>
        ) : (
          <View className="gap-2">
            {data?.data.map((student) => (
              <View
                className="rounded-lg border border-border bg-card p-4"
                key={student.id}
              >
                <Typography.Paragraph type="body">
                  {student.fullName}
                </Typography.Paragraph>
                <Typography.Paragraph color="muted" type="body-sm">
                  {student.code}
                  {student.level?.name ? ` · ${student.level.name}` : ""}
                  {student.schoolName ? ` · ${student.schoolName}` : ""}
                </Typography.Paragraph>
              </View>
            ))}
          </View>
        )}

        {data?.totalCount !== undefined ? (
          <Typography.Paragraph color="muted" type="body-sm">
            {data.totalCount} student{data.totalCount === 1 ? "" : "s"} found
          </Typography.Paragraph>
        ) : null}
      </View>
    </ScrollView>
  );
}
