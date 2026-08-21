import { router } from "expo-router";
import {
  Button,
  Input,
  Label,
  LinkButton,
  TextField,
  Typography,
} from "heroui-native";
import { useState } from "react";
import { Alert, Image, useColorScheme, View } from "react-native";

import { isEmailAddress, normalizeUsername } from "@repo/auth/username";

import { supabase } from "@/lib/supabase";

interface AuthError {
  message: string;
}

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const logoColor = colorScheme === "dark" ? "#fafafa" : "#171717";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!(identifier && password)) {
      Alert.alert("Missing details", "Enter your email or username and password.");
      return;
    }

    setIsSubmitting(true);

    let loginEmail = identifier.trim();

    if (!isEmailAddress(loginEmail)) {
      const { data: resolvedEmail } = await supabase.rpc("get_email_by_username", {
        p_username: normalizeUsername(loginEmail),
      });

      if (!resolvedEmail) {
        setIsSubmitting(false);
        Alert.alert("Sign in failed", "Invalid email/username or password.");
        return;
      }

      loginEmail = resolvedEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Sign in failed", (error as AuthError).message);
      return;
    }

    // The (auth)/_layout guard redirects to the app once the session lands.
    router.replace("/");
  };

  return (
    <View className="flex-1 justify-center bg-background px-6 py-12">
      <View className="gap-6">
        <View className="items-center">
          <Image
            className="h-16 w-16"
            resizeMode="contain"
            source={require("@/assets/images/android-icon-monochrome.png")}
            tintColor={logoColor}
          />
        </View>
        <View className="gap-2">
          <Typography.Heading type="h1">Sign in to KLIO.MY</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            Manage your tuition centre on the go.
          </Typography.Paragraph>
        </View>

        <View className="gap-4">
          <TextField isDisabled={isSubmitting} isRequired>
            <Label>Email or username</Label>
            <Input
              autoCapitalize="none"
              autoComplete="username"
              onChangeText={setIdentifier}
              placeholder="you@example.com or username"
              value={identifier}
            />
          </TextField>

          <TextField isDisabled={isSubmitting} isRequired>
            <Label>Password</Label>
            <Input
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              value={password}
            />
          </TextField>

          <Button
            isDisabled={isSubmitting}
            onPress={handleSignIn}
            variant="primary"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <LinkButton
            onPress={() => router.push("/(auth)/forgot-password")}
            size="sm"
          >
            Forgot password?
          </LinkButton>
        </View>

        <View className="flex-row items-center justify-center gap-1">
          <Typography.Paragraph color="muted" type="body-sm">
            Don&apos;t have an account?
          </Typography.Paragraph>
          <LinkButton onPress={() => router.push("/(auth)/sign-up")} size="sm">
            Sign up
          </LinkButton>
        </View>
      </View>
    </View>
  );
}
