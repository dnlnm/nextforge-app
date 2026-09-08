"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import type React from "react";

import { cn } from "@repo/design-system/lib/utils";

/**
 * Vanilla checkbox for surfaces that must not carry the design-system
 * checkbox styling. Plain Base UI Root + Indicator with neutral tokens —
 * the shadcn-vanilla equivalent where no fluid component exists.
 */
export function VanillaCheckbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props): React.ReactElement {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background text-primary-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50 data-indeterminate:border-primary data-indeterminate:bg-primary",
        className
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="flex items-center justify-center"
        data-slot="checkbox-indicator"
        render={(
          props: React.ComponentProps<"span">,
          state: CheckboxPrimitive.Indicator.State
        ) => {
          const visible = state.checked || state.indeterminate;
          return (
            <span
              {...props}
              className={cn(
                "flex items-center justify-center",
                !visible && "invisible"
              )}
            >
              {state.indeterminate ? (
                <MinusIcon aria-hidden="true" className="size-3" />
              ) : (
                <CheckIcon aria-hidden="true" className="size-3" />
              )}
            </span>
          );
        }}
      />
    </CheckboxPrimitive.Root>
  );
}
