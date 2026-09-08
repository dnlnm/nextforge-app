import { cn } from "@repo/design-system/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KpiStatColor = "default" | "error" | "info" | "success" | "warning";

const colorStyles: Record<KpiStatColor, string> = {
  default: "bg-primary text-primary-foreground",
  error: "bg-destructive text-white",
  info: "bg-info text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-neutral-950",
};

/** Vanilla colored icon chip for KPI stats (no design-system dependency). */
export function KpiStatIcon({
  color,
  icon: Icon,
  className,
}: {
  color: KpiStatColor;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
        colorStyles[color],
        className
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </div>
  );
}
