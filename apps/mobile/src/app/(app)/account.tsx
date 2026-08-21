import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@repo/auth/username";
import {
  Button,
  Description,
  Input,
  Label,
  TextField,
  Typography,
} from "heroui-native";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { useSession } from "@/lib/session-provider";
import { supabase } from "@/lib/supabase";

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const currentUsername =
    (user?.user_metadata?.username as string | undefined) ?? "";
  const [username, setUsername] = useState(currentUsername);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const normalized = normalizeUsername(username);

    if (!isValidUsername(normalized)) {
      Alert.alert(
        "Invalid username",
        `Use ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters: letters, numbers, dots, dashes, or underscores.`,
      );
      return;
    }

    if (normalized === normalizeUsername(currentUsername)) {
      return;
    }

    setIsSaving(true);

    const { data: available } = await supabase.rpc("is_username_available", {
      p_username: normalized,
    });

    if (!available) {
      setIsSaving(false);
      Alert.alert("Username taken", "That username is already in use.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { username: normalized },
    });

    setIsSaving(false);

    if (error) {
      Alert.alert(
        "Update failed",
        error.message.includes("already taken")
          ? "That username is already in use."
          : error.message,
      );
      return;
    }

    Alert.alert("Username updated", "You can now sign in with your username.");
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-6 px-5 py-6">
        <View className="gap-1">
          <Typography.Heading type="h2">Account</Typography.Heading>
          <Typography.Paragraph color="muted" type="body-sm">
            {user?.email}
          </Typography.Paragraph>
        </View>

        <TextField isDisabled={isSaving}>
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
            Letters, numbers, dots, dashes, underscores. Unique across all
            centres.
          </Description>
        </TextField>

        <Button
          isDisabled={
            isSaving ||
            normalizeUsername(username) ===
              normalizeUsername(currentUsername) ||
            !isValidUsername(username)
          }
          onPress={handleSave}
          variant="primary"
        >
          {isSaving ? "Saving..." : "Save username"}
        </Button>

        <Button onPress={signOut} variant="danger-soft">
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}
