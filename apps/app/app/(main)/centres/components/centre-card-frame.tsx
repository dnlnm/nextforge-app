"use client";

import { Elevated } from "@repo/design-system/lib/elevated";
import { useShape } from "@repo/design-system/lib/shape-context";
import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

/** Visible surface frame replacing CardShell for centre cards. */
export const CentreCardFrame = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  const shape = useShape();
  return (
    <Elevated
      className={cn(shape.container, "overflow-hidden", className)}
      offset={1}
    >
      {children}
    </Elevated>
  );
};
