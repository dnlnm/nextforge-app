import { hasTenantRole } from "@repo/auth/shared";
import { Button } from "heroui-native";
import { useRouter, Stack } from "expo-router";
import { View } from "react-native";

import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useOrganization } from "@/lib/organization-provider";

export function TabStack({ title }: { title: string }) {
  const router = useRouter();
  const { role } = useOrganization();
  const isAdmin = role ? hasTenantRole(role, ["ADMIN"]) : false;

  return (
    <Stack
      screenOptions={{
        title,
        headerRight: () => (
          <View className="flex-row items-center gap-2">
            {isAdmin ? (
              <Button
                onPress={() => router.push("/manage")}
                size="sm"
                variant="ghost"
              >
                Manage
              </Button>
            ) : null}
            <OrganizationSwitcher />
          </View>
        ),
      }}
    />
  );
}