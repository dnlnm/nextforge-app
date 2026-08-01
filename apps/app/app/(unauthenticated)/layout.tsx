import { currentUser } from "@repo/auth/server";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  const user = await currentUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};

export default AuthLayout;
