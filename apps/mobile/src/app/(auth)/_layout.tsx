import { Redirect, Stack } from "expo-router";

import { useSession } from "@/lib/session-provider";

export default function AuthLayout() {
  const { session } = useSession();

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
      <Stack.Screen name="sign-up" options={{ title: "Sign up" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Reset password" }}
      />
    </Stack>
  );
}
