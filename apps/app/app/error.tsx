"use client";

import { getMainDomain } from "@repo/auth/domain";
import { TENANT_ACCESS_DENIED_MESSAGE } from "@repo/auth/errors";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
        <Card className="w-full max-w-md">
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
              variant="outline"
              render={<Link href={`https://${getMainDomain()}/account`} />}
            >
              Manage my account
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="outline"
            render={<Link href={`https://${getMainDomain()}/centres`} />}
          >
            Go to my centres
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AppError;
