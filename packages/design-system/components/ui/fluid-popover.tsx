"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@repo/design-system/lib/utils";
import { spring } from "@repo/design-system/lib/springs";
import { useShape } from "@repo/design-system/lib/shape-context";
import {
  SurfaceProvider,
  useSurface,
} from "@repo/design-system/lib/surface-context";
import { surfaceClasses } from "@repo/design-system/lib/surface-classes";

function FluidPopover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function FluidPopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * Anchored, non-modal — no backdrop, unlike Dialog. It enters on the fast
 * tier from a small trigger-facing offset on its resolved side, so collision
 * handling never breaks the connection between the trigger and its floating
 * surface. Surface tracks the elevation ladder (substrate + 2, shadow 3 —
 * the popup convention shared with dropdown and select menus).
 */
function FluidPopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  children,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const reduceMotion = useReducedMotion();
  const substrate = useSurface();
  const level = Math.min(substrate + 2, 8);
  const shape = useShape();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          render={(popupProps, state) => {
            const exiting = state.transitionStatus === "ending";
            const triggerOffset = reduceMotion
              ? { x: 0, y: 0 }
              : {
                  x: state.side === "right" ? -4 : state.side === "left" ? 4 : 0,
                  y: state.side === "bottom" ? -4 : state.side === "top" ? 4 : 0,
                };
            return (
              <motion.div
                {...(popupProps as Record<string, unknown>)}
                {...(props as Record<string, unknown>)}
                className={cn(
                  shape.container,
                  surfaceClasses(level, 3),
                  className
                )}
                initial={{ opacity: 0, ...triggerOffset }}
                animate={{
                  opacity: exiting ? 0 : 1,
                  x: exiting ? triggerOffset.x : 0,
                  y: exiting ? triggerOffset.y : 0,
                }}
                transition={exiting ? spring.fast.exit : spring.fast.enter}
              >
                <SurfaceProvider value={level}>{children}</SurfaceProvider>
              </motion.div>
            );
          }}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { FluidPopover, FluidPopoverTrigger, FluidPopoverContent };
export {
  FluidPopover as Popover,
  FluidPopoverTrigger as PopoverTrigger,
  FluidPopoverContent as PopoverPopup,
};
