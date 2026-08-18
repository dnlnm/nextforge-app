import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Button, Spinner, Typography } from "heroui-native";
import { View } from "react-native";

import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useOrganization } from "@/lib/organization-provider";
import { useSession } from "@/lib/session-provider";

export default function TabsLayout() {
  const { isInitializing, session, signOut } = useSession();
  const { activeMembership, isLoading, memberships } = useOrganization();

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!activeMembership) {
    return (
      <View className="flex-1 justify-center gap-6 bg-background px-6">
        <View className="gap-2">
          <Typography.Heading type="h2">Choose your centre</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {memberships.length > 0
              ? "Select the centre you want to work in."
              : "No active centre memberships were found for this account."}
          </Typography.Paragraph>
        </View>
        {memberships.length > 0 ? <OrganizationSwitcher /> : null}
        <Button onPress={signOut} variant="danger-soft">
          Sign out
        </Button>
      </View>
    );
  }

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(attendance)">
        <NativeTabs.Trigger.Icon sf="checkmark.circle" md="fact_check" />
        <NativeTabs.Trigger.Label>Attendance</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(classes)">
        <NativeTabs.Trigger.Icon sf="book.closed" md="menu_book" />
        <NativeTabs.Trigger.Label>Classes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(students)">
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
        <NativeTabs.Trigger.Label>Students</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}