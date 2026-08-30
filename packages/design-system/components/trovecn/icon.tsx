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
        default: "border-border bg-background dark:border-input dark:bg-input/30",
        error:
          "border-destructive/24 bg-destructive/16 text-destructive dark:border-destructive/32 dark:bg-destructive/24",
        info: "border-info/24 bg-info/16 text-info dark:border-info/32 dark:bg-info/24",
        success:
          "border-success/24 bg-success/16 text-success dark:border-success/32 dark:bg-success/24",
        warning:
          "border-warning/24 bg-warning/16 text-warning dark:border-warning/32 dark:bg-warning/24",
      },
      size: {
        default: "size-8",
        lg: "size-9 [&_svg:not([class*='size-'])]:size-5",
        sm: "size-7 rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        elevated: "shadow-bevel border-border bg-background dark:border-input dark:bg-input/30",
        "elevated-filled": "shadow-bevel",
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
