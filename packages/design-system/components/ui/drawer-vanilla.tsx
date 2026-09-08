"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import type React from "react";

import { cn } from "@repo/design-system/lib/utils";
import { spring } from "@repo/design-system/lib/springs";

/**
 * Vanilla right-side sheet for surfaces that must not carry the
 * design-system drawer styling. Plain Base UI Dialog with a motion slide —
 * the shadcn-vanilla equivalent where no fluid component exists.
 */
export function VanillaDrawer({
  children,
  ...props
}: DialogPrimitive.Root.Props): React.ReactElement {
  return (
    <DialogPrimitive.Root data-slot="drawer" {...props}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function VanillaDrawerPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & { className?: string }): React.ReactElement {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="drawer-overlay"
        render={(backdropProps, state) => {
          const exiting = state.transitionStatus === "ending";
          return (
            <motion.div
              {...(backdropProps as Record<string, unknown>)}
              className="fixed inset-0 z-50 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: exiting ? 0 : 1 }}
              transition={exiting ? spring.slow.exit : spring.slow.enter}
            />
          );
        }}
      />
      <DialogPrimitive.Popup
        data-slot="drawer-content"
        render={(popupProps, state) => {
          const exiting = state.transitionStatus === "ending";
          return (
            <motion.div
              {...(popupProps as Record<string, unknown>)}
              {...(props as Record<string, unknown>)}
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-[92vw] flex-col overflow-hidden border-l bg-background shadow-xl outline-none",
                className
              )}
              initial={{ x: "100%" }}
              animate={{ x: exiting ? "100%" : "0%" }}
              transition={exiting ? spring.slow.exit : spring.slow.enter}
            >
              {children}
            </motion.div>
          );
        }}
      />
    </DialogPrimitive.Portal>
  );
}

export function VanillaDrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="drawer-header"
      className={cn("grid gap-1 border-b p-6", className)}
      {...props}
    />
  );
}

export function VanillaDrawerTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props): React.ReactElement {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-lg leading-none", className)}
      {...props}
    />
  );
}

export function VanillaDrawerDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.ReactElement {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export function VanillaDrawerPanel({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="drawer-panel"
      className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}
