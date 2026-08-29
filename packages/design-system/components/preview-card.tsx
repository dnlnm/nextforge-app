import type * as React from "react";
import { cn } from "@repo/design-system/lib/utils";

export function PreviewCard({
  label,
  footer,
  header,
  className,
  stageClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  stageClassName?: string;
}) {
  return (
    <div
      className={cn("rounded-xl bg-card p-[5px] shadow-card", className)}
      data-slot="preview-card"
      {...props}
    >
      {header ? (
        <div className="flex items-center justify-between px-2.5 pt-2 pb-3 text-meta text-muted-foreground">
          {header}
        </div>
      ) : null}
      <div
        className={cn(
          "flex justify-center rounded-lg bg-background p-8 shadow-well sm:p-12",
          stageClassName,
        )}
      >
        {children}
      </div>
      {label || footer ? (
        <div className="flex items-center justify-between gap-2 px-2.5 pt-3 pb-2">
          {label ? (
            <span className="min-w-0 truncate font-mono text-meta text-muted-foreground">
              {label}
            </span>
          ) : null}
          {footer ? (
            <div className="flex shrink-0 items-center gap-1.5">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}