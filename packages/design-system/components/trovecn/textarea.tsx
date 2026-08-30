"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { mergeProps } from "@base-ui/react/merge-props";
import type * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@repo/design-system/lib/utils";

const textareaControlVariants = cva(
  "relative inline-flex w-full rounded-lg bg-background not-dark:bg-clip-padding text-base ring-ring/24 transition-shadow has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring dark:has-aria-invalid:ring-destructive/24",
  {
    defaultVariants: { variant: "elevated" },
    variants: {
      variant: {
        default:
          "border border-input shadow-xs/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        elevated:
          "shadow-bevel border border-border hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
      },
    },
  },
);

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> &
  React.RefAttributes<HTMLTextAreaElement> & {
    size?: "sm" | "default" | "lg" | number;
    unstyled?: boolean;
    variant?: "default" | "elevated";
  };

export function Textarea({
  className,
  size = "default",
  unstyled = false,
  variant = "elevated",
  ref,
  ...props
}: TextareaProps): React.ReactElement {
  return (
    <span
      className={
        cn(!unstyled && textareaControlVariants({ variant }), className) || undefined
      }
      data-size={size}
      data-slot="textarea-control"
      data-variant={variant}
    >
      <FieldPrimitive.Control
        ref={ref}
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        id={props.id}
        name={props.name}
        render={(defaultProps: React.ComponentProps<"textarea">) => (
          <textarea
            className={cn(
              "field-sizing-content min-h-17.5 w-full rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] text-foreground outline-none placeholder:text-muted-foreground/72 max-sm:min-h-20.5",
              size === "sm" &&
                "min-h-16.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] max-sm:min-h-19.5",
              size === "lg" &&
                "min-h-18.5 py-[calc(--spacing(2)-1px)] max-sm:min-h-21.5",
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, props)}
          />
        )}
      />
    </span>
  );
}

export { FieldPrimitive };
export { textareaControlVariants };
