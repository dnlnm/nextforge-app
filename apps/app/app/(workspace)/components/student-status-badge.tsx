"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { cn } from "@repo/design-system/lib/utils";

export const StudentStatusBadge = ({
  status,
}: {
  readonly status: string;
}) => {
  const isActive = status === "ACTIVE";

  return (
    <Badge variant="outline">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-muted-foreground"
        )}
      />
      {isActive ? "Active" : "Archived"}
    </Badge>
  );
};
