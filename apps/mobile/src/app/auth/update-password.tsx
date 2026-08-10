import { router } from "expo-router";
import {
  Button,
  Description,
  Input,
  Label,
  TextField,
  Typography,
} from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }

    if (password !== confirmation) {
      Alert.alert("Passwords do not match", "Enter the same password twice.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Could not update password", error.message);
      return;
    }

    Alert.alert("Password updated", "Your new password is ready to use.");
    router.replace("/(app)");
  };

  return (
    <View className="flex-1 justify-center gap-6 bg-background px-6 py-12">
      <View className="gap-2">
        <Typography.Heading type="h1">Choose a new password</Typography.Heading>
        <Typography.Paragraph color="muted" type="body-sm">
          Use a password you do not use elsewhere.
        </Typography.Paragraph>
      </View>
      <View className="gap-4">
        <TextField isDisabled={isSubmitting} isRequired>
          <Label>New password</Label>
          <Input onChangeText={setPassword} secureTextEntry value={password} />
          <Description>Use at least 6 characters.</Description>
        </TextField>
        <TextField isDisabled={isSubmitting} isRequired>
          <Label>Confirm password</Label>
          <Input
            onChangeText={setConfirmation}
            secureTextEntry
            value={confirmation}
          />
        </TextField>
        <Button isDisabled={isSubmitting} onPress={handleUpdate}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </View>
    </View>
  );
}
