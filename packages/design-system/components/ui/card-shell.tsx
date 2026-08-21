import { Card } from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import type React from "react";

interface CardShellProps extends React.ComponentProps<"div"> {
  readonly panelClassName?: string;
}

export function CardShell({
  className,
  panelClassName,
  children,
  ...props
}: CardShellProps): React.ReactElement {
  return (
    <div
      className={cn("rounded-xl border border-border/70 p-1", className)}
      data-slot="card-shell"
      {...props}
    >
      <Card
        className={cn(
          "h-full rounded-lg bg-muted/20 shadow-none before:hidden has-data-[slot=table-container]:overflow-hidden",
          panelClassName,
        )}
      >
        {children}
      </Card>
    </div>
  );
}
