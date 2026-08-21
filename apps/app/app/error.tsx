"use client";

import { getMainDomain } from "@repo/auth/domain";
import { TENANT_ACCESS_DENIED_MESSAGE } from "@repo/auth/errors";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import Link from "next/link";
import { useEffect } from "react";

interface AppErrorProperties {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const AppError = ({ error, reset }: AppErrorProperties) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (error.message === TENANT_ACCESS_DENIED_MESSAGE) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <CardShell className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No access to this centre</CardTitle>
            <CardDescription>
              You are not a member of this centre, so you can't access its
              workspace. Please contact the centre owner for an invitation, or
              switch to one of your own centres.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              render={<Link href={`https://${getMainDomain()}/centres`} />}
            >
              Go to my centres
            </Button>
            <Button
              render={<Link href={`https://${getMainDomain()}/account`} />}
              variant="outline"
            >
              Manage my account
            </Button>
          </CardContent>
        </CardShell>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <CardShell className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button
            render={<Link href={`https://${getMainDomain()}/centres`} />}
            variant="outline"
          >
            Go to my centres
          </Button>
        </CardContent>
      </CardShell>
    </main>
  );
};

export default AppError;
