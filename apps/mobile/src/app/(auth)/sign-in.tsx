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
import { Alert, View } from "react-native";

import { supabase } from "@/lib/supabase";

interface AuthError {
  message: string;
}

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!(email && password)) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
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
        <View className="gap-2">
          <Typography.Heading type="h1">Sign in to KLIO.MY</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            Manage your tuition centre on the go.
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
