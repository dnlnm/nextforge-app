import { Card, CardFrame } from "@repo/design-system/components/ui/card";
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
    <CardFrame
      className={cn(
        "isolate after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 dark:bg-background",
        className,
      )}
      data-slot="card-shell"
      {...props}
    >
      <Card
        className={cn(
          "min-h-0 flex-1 flex-col has-data-[slot=table-container]:overflow-hidden dark:bg-background",
          panelClassName,
        )}
      >
        {children}
      </Card>
    </CardFrame>
  );
}
