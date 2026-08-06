"use client";

import { createClient } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Separator } from "@repo/design-system/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvitation } from "../actions";

interface InviteAcceptClientProps {
  readonly email?: string;
  readonly fullName?: string;
  readonly organizationName?: string;
  readonly signedInEmail?: string;
  readonly state?: "error" | "invalid";
  readonly token?: string;
}

type InviteState =
  | { error: string; kind: "error" }
  | { kind: "no-session" }
  | { kind: "ready" };

export const InviteAcceptClient = ({
  email,
  fullName,
  organizationName,
  signedInEmail,
  state,
  token,
}: InviteAcceptClientProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<InviteState>({ kind: "ready" });

  if (state === "invalid") {
    return (
      <Shell>
        <p className="text-muted-foreground">This invite link is not valid.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go to TLAS.MY</Link>
        </Button>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <p className="text-muted-foreground">
          This centre is no longer active.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go to TLAS.MY</Link>
        </Button>
      </Shell>
    );
  }

  const accept = async () => {
    if (!token) {
      return;
    }

    setBusy(true);
    const result = await acceptInvitation(token);
    setBusy(false);

    if (result.status === "success") {
      router.push("/today");
      router.refresh();
      return;
    }

    if (result.status === "no-session") {
      setInvite({ kind: "no-session" });
      return;
    }

    setInvite({ error: result.error, kind: "error" });
  };

  const emailMatches = signedInEmail === email?.toLowerCase();
  const redirectTo = token
    ? `/invite/accept?token=${encodeURIComponent(token)}`
    : "/invite/accept";
  const redirectQuery = `redirect_to=${encodeURIComponent(redirectTo)}`;

  const signOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
  };

  if (invite.kind === "no-session") {
    return (
      <Shell>
        <p className="text-muted-foreground">
          You need to sign in to accept this invitation.
        </p>
        <div className="mt-6 grid gap-3">
          <Button asChild>
            <Link href={`/sign-in?${redirectQuery}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/sign-up?${redirectQuery}`}>Create an account</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {invite.kind === "error" ? (
        <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          {invite.error}
        </p>
      ) : null}

      {signedInEmail ? null : (
        <p className="text-muted-foreground">
          {fullName}, {organizationName} has invited you to teach with TLAS.MY.
          Sign in with {email} to accept.
        </p>
      )}
      {signedInEmail && !emailMatches ? (
        <div className="grid gap-3">
          <p className="rounded-md bg-amber-500/10 p-3 text-amber-700 text-sm">
            You&apos;re signed in as {signedInEmail}, but this invitation is for{" "}
            {email}. Sign out and sign in with that email to accept.
          </p>
          <Button onClick={signOut} variant="outline">
            Sign out
          </Button>
        </div>
      ) : null}
      {signedInEmail && emailMatches ? (
        <p className="text-muted-foreground">
          {fullName}, you&apos;ve been invited to join {organizationName} as a
          teacher on TLAS.MY.
        </p>
      ) : null}

      {signedInEmail && emailMatches ? (
        <Button className="mt-6" disabled={busy} onClick={accept}>
          {busy ? "Accepting..." : "Accept invitation"}
        </Button>
      ) : null}
    </Shell>
  );
};

interface ShellProps {
  readonly children: React.ReactNode;
}

const Shell = ({ children }: ShellProps) => (
  <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
    <Card className="w-full max-w-md">
      <CardHeader className="border-b text-center">
        <CardTitle className="font-semibold text-xl tracking-tight">
          Teacher invitation
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="grid gap-2 p-8 text-center">
        {children}
      </CardContent>
    </Card>
  </div>
);
