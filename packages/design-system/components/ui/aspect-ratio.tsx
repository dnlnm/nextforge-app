"use client";

import type * as React from "react";
import { cn } from "@repo/design-system/lib/utils";

export function AspectRatio({
  className,
  ratio = 1,
  ...props
}: React.ComponentProps<"div"> & {
  ratio?: number;
}): React.ReactElement {
  return (
    <div
      className={cn("relative w-full", className)}
      style={{ aspectRatio: ratio }}
      {...props}
    />
  );
}
