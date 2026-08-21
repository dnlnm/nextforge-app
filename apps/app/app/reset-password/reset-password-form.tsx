"use client";

import { createClient } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await createClient().auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toastManager.add({
      title: "Password updated. You are signed in.",
      type: "success",
    });
    router.push("/account");
    router.refresh();
  };

  return (
    <CardShell className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                autoComplete="new-password"
                disabled={loading}
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                autoComplete="new-password"
                disabled={loading}
                id="confirm-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Must be at least 8 characters long.
          </p>

          {error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <Button disabled={loading} type="submit">
            {loading ? "Updating password..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </CardShell>
  );
};
