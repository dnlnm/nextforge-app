import type { ConfigContext } from "expo/config";

export default ({ config }: ConfigContext) => ({
  ...config,
  name: "KLIO.MY",
  slug: "klio-my",
  scheme: "klio",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  android: {
    ...config.android,
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...config.web,
    output: "static",
  },
  plugins: [...(config.plugins ?? []), "expo-secure-store"],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
});
