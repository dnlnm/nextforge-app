import "../../global.css";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OrganizationProvider } from "@/lib/organization-provider";
import { SessionProvider } from "@/lib/session-provider";
import { TRPCProvider } from "@/lib/trpc-provider";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <SessionProvider>
          <TRPCProvider>
            <OrganizationProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="auth" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </OrganizationProvider>
          </TRPCProvider>
        </SessionProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
