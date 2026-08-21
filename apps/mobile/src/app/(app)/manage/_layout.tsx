import { hasTenantRole } from "@repo/auth/shared";
import { Redirect, Stack } from "expo-router";
import { Spinner } from "heroui-native";
import { View } from "react-native";

import { useOrganization } from "@/lib/organization-provider";

export default function ManageLayout() {
  const { isLoading, role } = useOrganization();
  const isAdmin = role ? hasTenantRole(role, ["ADMIN"]) : false;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/(app)/(tabs)/(home)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Manage" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="invoices" options={{ title: "Invoices" }} />
      <Stack.Screen name="payments" options={{ title: "Payments" }} />
      <Stack.Screen name="members" options={{ title: "Members" }} />
    </Stack>
  );
}
