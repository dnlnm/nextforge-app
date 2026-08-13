import "../../global.css";

import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OrganizationProvider } from "@/lib/organization-provider";
import { SessionProvider } from "@/lib/session-provider";
import { TRPCProvider } from "@/lib/trpc-provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    "CalSans-Regular": require("@/assets/fonts/CalSansUI-UIRegular.otf"),
    "CalSans-Medium": require("@/assets/fonts/CalSansUI-UIMedium.otf"),
    "CalSans-SemiBold": require("@/assets/fonts/CalSansUI-UISemiBold.otf"),
    "CalSans-Bold": require("@/assets/fonts/CalSansUI-UIBold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
