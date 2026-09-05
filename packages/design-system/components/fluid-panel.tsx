"use client";

import type * as React from "react";
import { cn } from "@repo/design-system/lib/utils";
import { Elevated } from "@repo/design-system/lib/elevated";
import {
  SurfaceProvider,
  useSurface,
} from "@repo/design-system/lib/surface-context";
import { SURFACE_BG } from "@repo/design-system/lib/surface-classes";
import { useShape } from "@repo/design-system/lib/shape-context";

/**
 * Fluid preview/stage card. Same props API as `PreviewCard` so call sites
 * swap one import — but the frame tracks the elevation ladder instead of
 * fixed `bg-card`/`shadow-card` tokens:
 *
 * - Shell sits two rungs above its surroundings (`Elevated offset={2}`) and
 *   re-provides that level downward.
 * - Stage sits recessed on the substrate floor, so it reads "cut in" at any
 *   nesting depth: page → shell 3 / stage 1, dialog → shell 7 / stage 5.
 * - Stage children are re-provided the floor level, so nested fluid
 *   components (buttons, tooltips, popovers) elevate from the stage, not
 *   the shell.
 */
export function FluidPanel({
  label,
  footer,
  header,
  className,
  stageClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  stageClassName?: string;
}) {
  const substrate = useSurface();
  const shape = useShape();
  // Shell floats two rungs above the surroundings; the stage stays recessed
  // on the substrate floor (page → 3/1, dialog → 7/5).

  return (
    <Elevated
      className={cn("overflow-hidden p-[5px]", shape.container, className)}
      data-slot="fluid-panel"
      offset={2}
      {...props}
    >
      {header ? (
        <div className="flex items-center justify-between overflow-hidden px-2.5 pt-2 pb-3 text-meta text-muted-foreground">
          {header}
        </div>
      ) : null}
      <div
        className={cn(
          "flex justify-center overflow-hidden p-8 shadow-well sm:p-12",
          SURFACE_BG[substrate],
          shape.bg,
          stageClassName
        )}
      >
        <SurfaceProvider value={substrate}>{children}</SurfaceProvider>
      </div>
      {label || footer ? (
        <div className="flex items-center justify-between gap-2 px-2.5 pt-3 pb-2">
          {label ? (
            <span className="min-w-0 truncate font-mono text-meta text-muted-foreground">
              {label}
            </span>
          ) : null}
          {footer ? (
            <div className="flex flex-1 items-center gap-1.5 [&>div]:w-full">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </Elevated>
  );
}
