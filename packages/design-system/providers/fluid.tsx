"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ShapeProvider } from "@repo/design-system/lib/shape-context";
import { SizeProvider } from "@repo/design-system/lib/size-context";
import { SurfaceProvider } from "@repo/design-system/lib/surface-context";
import { IconProvider } from "@repo/design-system/lib/icon-context";

/** Fluid Functionalism providers: shape + size + surface + icons + reduced-motion. */
export function FluidProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider>
        <SizeProvider>
          <SurfaceProvider value={1}>
            <IconProvider>{children}</IconProvider>
          </SurfaceProvider>
        </SizeProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
