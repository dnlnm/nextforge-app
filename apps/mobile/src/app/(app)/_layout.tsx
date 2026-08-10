import { hasTenantRole } from "@repo/auth/shared";
import { Redirect, Tabs } from "expo-router";
import { Button, Spinner, Typography } from "heroui-native";
import { View } from "react-native";

import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useOrganization } from "@/lib/organization-provider";
import { useSession } from "@/lib/session-provider";

export default function AppLayout() {
  const { session, signOut } = useSession();
  const { activeMembership, isLoading, memberships, role } = useOrganization();

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

  const isAdmin = role ? hasTenantRole(role, ["ADMIN"]) : false;

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <View className="pr-2">
            <OrganizationSwitcher />
          </View>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="attendance" options={{ title: "Attendance" }} />
      <Tabs.Screen name="classes" options={{ title: "Classes" }} />
      <Tabs.Screen name="students" options={{ title: "Students" }} />
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="invoices" options={{ title: "Invoices" }} />
        <Tabs.Screen name="payments" options={{ title: "Payments" }} />
        <Tabs.Screen name="members" options={{ title: "Members" }} />
      </Tabs.Protected>
    </Tabs>
  );
}
