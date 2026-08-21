import { createURL } from "expo-linking";
import { router } from "expo-router";
import {
  Button,
  Description,
  Input,
  Label,
  LinkButton,
  TextField,
  Typography,
} from "heroui-native";
import { useState } from "react";
import { Alert, Image, useColorScheme, View } from "react-native";

import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@repo/auth/username";

import { supabase } from "@/lib/supabase";

interface AuthError {
  message: string;
}

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const logoColor = colorScheme === "dark" ? "#fafafa" : "#171717";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!(email && password)) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    const normalizedUsername = normalizeUsername(username);

    if (!isValidUsername(normalizedUsername)) {
      Alert.alert(
        "Invalid username",
        `Use ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters: letters, numbers, dots, dashes, or underscores.`
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: normalizedUsername },
        emailRedirectTo: createURL("auth/callback", {
          queryParams: { type: "signup" },
        }),
      },
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Sign up failed", (error as AuthError).message);
      return;
    }

    if (!data.session) {
      Alert.alert(
        "Check your inbox",
        "We emailed you a confirmation link to finish signing up."
      );
      return;
    }

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
          <Typography.Heading type="h1">Create your account</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            Your admin will link you to a tuition centre after sign-up.
          </Typography.Paragraph>
        </View>

        <View className="gap-4">
          <TextField isDisabled={isSubmitting} isRequired>
            <Label>Email</Label>
            <Input
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
          </TextField>

          <TextField isDisabled={isSubmitting} isRequired>
            <Label>Username</Label>
            <Input
              autoCapitalize="none"
              autoComplete="username"
              maxLength={USERNAME_MAX_LENGTH}
              onChangeText={setUsername}
              placeholder="yourname"
              value={username}
            />
            <Description>
              Letters, numbers, dots, dashes, underscores. Use this to sign in
              instead of your email.
            </Description>
          </TextField>

          <TextField isDisabled={isSubmitting} isRequired>
            <Label>Password</Label>
            <Input
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
            />
            <Description>Use at least 6 characters.</Description>
          </TextField>

          <Button
            isDisabled={isSubmitting}
            onPress={handleSignUp}
            variant="primary"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </View>

        <View className="flex-row items-center justify-center gap-1">
          <Typography.Paragraph color="muted" type="body-sm">
            Already have an account?
          </Typography.Paragraph>
          <LinkButton onPress={() => router.push("/(auth)/sign-in")} size="sm">
            Sign in
          </LinkButton>
        </View>
      </View>
    </View>
  );
}
