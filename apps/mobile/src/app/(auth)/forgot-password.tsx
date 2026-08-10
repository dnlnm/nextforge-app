import { createURL } from "expo-linking";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your account email.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: createURL("auth/callback", {
        queryParams: { type: "recovery" },
      }),
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Could not send email", error.message);
      return;
    }

    Alert.alert(
      "Check your inbox",
      "If an account exists for that email, a password reset link is on its way."
    );
  };

  return (
    <View className="flex-1 justify-center gap-6 bg-background px-6 py-12">
      <View className="gap-2">
        <Typography.Heading type="h1">Reset your password</Typography.Heading>
        <Typography.Paragraph color="muted" type="body-sm">
          We&apos;ll send a secure link that returns you to KLIO.MY.
        </Typography.Paragraph>
      </View>
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
      <Button isDisabled={isSubmitting} onPress={handleReset}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
      <LinkButton onPress={() => router.replace("/(auth)/sign-in")} size="sm">
        Back to sign in
      </LinkButton>
    </View>
  );
}
