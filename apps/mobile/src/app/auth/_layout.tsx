import { Stack } from "expo-router";

export default function AuthCallbackLayout() {
  return (
    <Stack>
      <Stack.Screen name="callback" options={{ title: "Verifying link" }} />
      <Stack.Screen
        name="update-password"
        options={{ title: "Choose password" }}
      />
    </Stack>
  );
}
