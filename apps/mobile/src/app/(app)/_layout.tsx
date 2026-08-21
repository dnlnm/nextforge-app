import { Stack } from "expo-router";

export default function AppStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="manage" options={{ headerShown: false }} />
      <Stack.Screen
        name="class/[classId]"
        options={{ title: "Class", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="session/[sessionId]"
        options={{ title: "Attendance", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="account" options={{ title: "Account" }} />
    </Stack>
  );
}
