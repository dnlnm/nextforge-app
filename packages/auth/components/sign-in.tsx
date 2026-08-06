"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Separator } from "@repo/design-system/components/ui/separator";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "../client";

export const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await createClient().auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo ?? "/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="grid gap-6 p-6 md:p-8" onSubmit={submit}>
            <div className="grid gap-2 text-center">
              <h1 className="font-bold text-2xl tracking-tight">
                Welcome back
              </h1>
              <p className="text-balance text-muted-foreground text-sm">
                Sign in to your TLAS.MY account
              </p>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  autoComplete="current-password"
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </p>
            ) : null}

            <Button disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 bg-card px-2 text-muted-foreground text-xs">
                Or continue with
              </span>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href="/sign-up"
              >
                Sign up
              </Link>
            </p>
          </form>
          <div className="relative hidden min-h-[420px] bg-muted md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_42%),linear-gradient(145deg,var(--muted),var(--background))]" />
            <div className="absolute inset-x-8 bottom-8 space-y-2">
              <p className="font-medium text-lg">
                One calm place to run your centre.
              </p>
              <p className="text-muted-foreground text-sm">
                Keep students, classes, attendance, invoices, and payments in
                sync.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="px-6 text-center text-muted-foreground text-xs">
        By continuing, you agree to our{" "}
        <Link
          className="underline underline-offset-4 hover:text-foreground"
          href="/legal/terms"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          className="underline underline-offset-4 hover:text-foreground"
          href="/legal/privacy"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};
