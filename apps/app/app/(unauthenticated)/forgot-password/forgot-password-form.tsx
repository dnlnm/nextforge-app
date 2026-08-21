"use client";

import { createClient } from "@repo/auth/client";
import { appName } from "@repo/config/brand";
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
import Link from "next/link";
import { useState } from "react";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error: resetError } = await createClient().auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <CardShell className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            If an account exists for {email}, a password reset link is on its
            way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/sign-in" />}>
            Back to sign in
          </Button>
        </CardContent>
      </CardShell>
    );
  }

  return (
    <CardShell className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your {appName} account email and we&apos;ll send you a reset
          link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              disabled={loading}
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="m@example.com"
              required
              type="email"
              value={email}
            />
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <Button disabled={loading} type="submit">
            {loading ? "Sending reset link..." : "Send reset link"}
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Remembered it?{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </CardShell>
  );
};
