import { Redirect } from "expo-router";
import { Spinner } from "heroui-native";
import { View } from "react-native";

import { useSession } from "@/lib/session-provider";

export default function Index() {
  const { session, isInitializing } = useSession();

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(app)" />
  ) : (
    <Redirect href="/(auth)/sign-in" />
  );
}
