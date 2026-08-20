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

interface WorkspaceErrorProperties {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const WorkspaceError = ({ error, reset }: WorkspaceErrorProperties) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (error.message === TENANT_ACCESS_DENIED_MESSAGE) {
    return (
      <section className="flex min-h-[calc(100dvh-12rem)] items-center justify-center p-6">
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
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100dvh-12rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default WorkspaceError;
