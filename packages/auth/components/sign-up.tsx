"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Separator } from "@repo/design-system/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../client";

export const SignUp = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/organization");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="grid gap-6 p-6 md:p-8" onSubmit={submit}>
            <div className="grid gap-2 text-center">
              <h1 className="font-bold text-2xl tracking-tight">
                Create your account
              </h1>
              <p className="text-balance text-muted-foreground text-sm">
                Start managing your tuition centre with TLAS.MY
              </p>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  autoComplete="name"
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Daniel Tan"
                  required
                  value={name}
                />
              </div>
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
                <p className="text-muted-foreground text-xs">
                  We&apos;ll use this to keep your centre account secure.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    autoComplete="new-password"
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
            </div>

            {error ? (
              <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </p>
            ) : null}

            <Button disabled={loading} type="submit">
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 bg-card px-2 text-muted-foreground text-xs">
                Or continue with
              </span>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href="/sign-in"
              >
                Sign in
              </Link>
            </p>
          </form>
          <div className="relative hidden min-h-[520px] bg-muted md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_42%),linear-gradient(225deg,var(--muted),var(--background))]" />
            <div className="absolute inset-x-8 bottom-8 space-y-2">
              <p className="font-medium text-lg">
                Built for the work behind every lesson.
              </p>
              <p className="text-muted-foreground text-sm">
                Set up your workspace, invite your team, and get back to
                teaching.
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
