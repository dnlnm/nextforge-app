import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

export const WorkspaceGrid = ({
  children,
}: {
  readonly children: ReactNode;
}) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
);

export const EmptyState = ({
  className,
  description,
  title,
}: {
  readonly className?: string;
  readonly description: string;
  readonly title: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center",
      className
    )}
  >
    <h3 className="mb-2 font-semibold text-xl">{title}</h3>
    <p className="max-w-md text-muted-foreground">{description}</p>
  </div>
);
