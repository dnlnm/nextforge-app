"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";
import type React from "react";
import { cn } from "@repo/design-system/lib/utils";
import { easeOutStrong, spring } from "@repo/design-system/lib/springs";

export function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props): React.ReactElement {
  const reduced = useReducedMotion();

  return (
    <CheckboxPrimitive.Root
      className={cn(
        "relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border border-input bg-background not-dark:bg-clip-padding shadow-xs/5 outline-none ring-ring transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[3px] not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/48 data-disabled:cursor-not-allowed data-disabled:opacity-64 sm:size-4 dark:not-data-checked:bg-input/32 dark:aria-invalid:ring-destructive/24 dark:not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)] [[data-disabled],[data-checked],[aria-invalid]]:shadow-none",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="absolute -inset-px flex items-center justify-center rounded-[.25rem] text-primary-foreground data-checked:bg-primary data-indeterminate:text-foreground"
        data-slot="checkbox-indicator"
        render={(
          props: React.ComponentProps<"span">,
          state: CheckboxPrimitive.Indicator.State,
        ) => {
          const visible = state.checked || state.indeterminate;

          return (
            <motion.span
              {...(props as HTMLMotionProps<"span">)}
              initial={false}
              animate={
                visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : visible
                    ? {
                        ...spring.quick.enter,
                        opacity: { duration: 0.18, ease: easeOutStrong },
                      }
                    : spring.quick.exit
              }
            >
              {state.indeterminate ? (
                <svg
                  aria-hidden="true"
                  className="size-3.5 sm:size-3"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M5.252 12h13.496"
                    initial={false}
                    animate={{ pathLength: visible ? 1 : 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : visible
                          ? spring.quick.enter
                          : spring.quick.exit
                    }
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="size-3.5 sm:size-3"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M5.252 12.7 10.2 18.63 18.748 5.37"
                    initial={false}
                    animate={{ pathLength: visible ? 1 : 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : visible
                          ? spring.quick.enter
                          : spring.quick.exit
                    }
                  />
                </svg>
              )}
            </motion.span>
          );
        }}
      />
    </CheckboxPrimitive.Root>
  );
}

export { CheckboxPrimitive };
