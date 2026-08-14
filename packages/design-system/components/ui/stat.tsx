import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@repo/design-system/lib/utils";
import {
  Card,
  CardFrame,
  CardFrameFooter,
} from "@repo/design-system/components/ui/card";

function Stat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardFrame
      className={cn("h-full", className)}
      data-slot="stat"
      {...props}
    />
  );
}

function StatPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-2 p-4",
        "**:data-[slot=stat-indicator]:col-start-1 **:data-[slot=stat-indicator]:row-start-1 **:data-[slot=stat-indicator]:self-center",
        "**:data-[slot=stat-label]:col-start-2 **:data-[slot=stat-label]:row-start-1 **:data-[slot=stat-label]:self-center",
        "**:data-[slot=stat-value]:col-span-2 **:data-[slot=stat-value]:row-start-2",
        className,
      )}
      data-slot="stat-panel"
      {...props}
    />
  );
}

function StatFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardFrameFooter
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-3",
        "**:data-[slot=stat-description]:min-w-0 **:data-[slot=stat-description]:flex-1",
        "**:data-[slot=stat-trend]:min-w-0 **:data-[slot=stat-trend]:flex-1",
        className,
      )}
      data-slot="stat-footer"
      {...props}
    />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-label"
      className={cn("font-medium text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

const statIndicatorVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "text-muted-foreground [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8 rounded-lg border [&_svg:not([class*='size-'])]:size-3.5",
        badge:
          "h-6 min-w-6 rounded-md border px-1.5 font-medium text-xs [&_svg:not([class*='size-'])]:size-3",
        action:
          "size-8 cursor-pointer rounded-md transition-colors hover:bg-muted/50 [&_svg:not([class*='size-'])]:size-4",
      },
      color: {
        default:
          "border-transparent bg-linear-to-b from-primary to-[oklch(from_var(--color-primary)_calc(l-0.08)_c_h)] text-primary-foreground",
        success:
          "border-transparent bg-linear-to-b from-success to-[oklch(from_var(--color-success)_calc(l-0.08)_c_h)] text-white",
        info: "border-transparent bg-linear-to-b from-info to-[oklch(from_var(--color-info)_calc(l-0.08)_c_h)] text-white",
        warning:
          "border-transparent bg-linear-to-b from-warning to-[oklch(from_var(--color-warning)_calc(l-0.08)_c_h)] text-neutral-950",
        error:
          "border-transparent bg-linear-to-b from-destructive to-[oklch(from_var(--color-destructive)_calc(l-0.08)_c_h)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  },
);

interface StatIndicatorProps
  extends Omit<React.ComponentProps<"div">, "color">,
    VariantProps<typeof statIndicatorVariants> {}

function StatIndicator({
  className,
  variant = "default",
  color = "default",
  ...props
}: StatIndicatorProps) {
  return (
    <div
      data-slot="stat-indicator"
      data-variant={variant}
      data-color={color}
      className={cn(statIndicatorVariants({ variant, color, className }))}
      {...props}
    />
  );
}

function StatValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-value"
      className={cn(
        "font-heading font-semibold text-2xl tabular-nums tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function StatTrend({
  className,
  trend,
  ...props
}: React.ComponentProps<"div"> & { trend?: "up" | "down" | "neutral" }) {
  return (
    <div
      data-slot="stat-trend"
      data-trend={trend}
      className={cn(
        "inline-flex items-center gap-1 font-medium text-xs [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        {
          "text-success": trend === "up",
          "text-destructive": trend === "down",
          "text-muted-foreground": trend === "neutral" || !trend,
        },
        className,
      )}
      {...props}
    />
  );
}

function StatAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-action"
      className={cn("inline-flex shrink-0", className)}
      {...props}
    />
  );
}

function StatDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-description"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export {
  Stat,
  StatAction,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatTrend,
  StatValue,
};
