"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@repo/design-system/lib/utils";

const iconVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border text-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      color: "default",
      size: "default",
      variant: "elevated-filled",
    },
    variants: {
      color: {
        default: "border-transparent bg-primary text-primary-foreground",
        error: "border-transparent bg-destructive text-white",
        info: "border-transparent bg-info text-white",
        success: "border-transparent bg-success text-white",
        warning: "border-transparent bg-warning text-neutral-950",
      },
      size: {
        default: "size-8",
        lg: "size-9 [&_svg:not([class*='size-'])]:size-5",
        sm: "size-7 rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        elevated:
          "shadow-[0_1px_2px_oklch(0_0_0/.06),inset_0_1px_0_oklch(1_0_0/.50)] border-border bg-background dark:border-input dark:bg-input/30",
        "elevated-filled":
          "shadow-[0_1px_2px_oklch(0_0_0/.06),inset_0_1px_0_oklch(1_0_0/.50),0_4px_12px_oklch(0_0_0/.12)]",
      },
    },
  },
);

export interface IconProps
  extends Omit<React.ComponentProps<"div">, "color">,
    VariantProps<typeof iconVariants> {}

export function Icon({
  className,
  color = "default",
  size = "default",
  variant = "elevated-filled",
  ...props
}: IconProps) {
  return (
    <div
      className={cn(iconVariants({ color, size, variant }), className)}
      data-color={color}
      data-slot="icon"
      data-variant={variant}
      {...props}
    />
  );
}

export { iconVariants };
