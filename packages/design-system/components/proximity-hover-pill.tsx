"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@repo/design-system/lib/utils";
import { spring } from "@repo/design-system/lib/springs";
import {
  proximityHoverWashClassName,
  proximityHoverWashOpacity,
  type ItemRect,
} from "@repo/design-system/hooks/use-proximity-hover";

/**
 * Shared "nearest item" hover pill for every `useProximityHover` consumer.
 * Position/size come from plain `style` (not animated props) — the `layout`
 * prop makes Framer Motion FLIP-animate the visual difference via
 * `transform` instead, which keeps it on the GPU compositor and inside
 * MotionConfig's automatic reduced-motion handling.
 */
export function ProximityHoverPill({
  activeRect,
  sessionKey,
  className,
}: {
  activeRect: ItemRect | null;
  sessionKey: number;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {activeRect ? (
        <motion.div
          key={sessionKey}
          layout
          className={cn(
            "pointer-events-none absolute rounded-lg",
            proximityHoverWashClassName,
            className,
          )}
          style={{
            top: activeRect.top,
            left: activeRect.left,
            width: activeRect.width,
            height: activeRect.height,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: proximityHoverWashOpacity }}
          exit={{ opacity: 0, transition: spring.fast.exit }}
          transition={spring.fast.enter}
        />
      ) : null}
    </AnimatePresence>
  );
}