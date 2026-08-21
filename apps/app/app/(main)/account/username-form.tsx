"use client";

import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@repo/auth/username";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateUsername } from "./actions";

interface UsernameFormProps {
  defaultUsername: string;
}

export const UsernameForm = ({ defaultUsername }: UsernameFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(defaultUsername);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await updateUsername(username);
      toastManager.add({
        title: "Username updated. You can now sign in with it.",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error ? error.message : "Failed to update username",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          autoComplete="username"
          disabled={loading}
          id="username"
          maxLength={USERNAME_MAX_LENGTH}
          minLength={USERNAME_MIN_LENGTH}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="danieltan"
          required
          type="text"
          value={username}
        />
        <p className="text-muted-foreground text-xs">
          Letters, numbers, dots, dashes, and underscores. Usernames are unique
          across all centres.
        </p>
      </div>

      <Button
        disabled={
          loading ||
          normalizeUsername(username) === normalizeUsername(defaultUsername) ||
          !isValidUsername(username)
        }
        type="submit"
      >
        {loading ? "Saving..." : "Update Username"}
      </Button>
    </form>
  );
};
