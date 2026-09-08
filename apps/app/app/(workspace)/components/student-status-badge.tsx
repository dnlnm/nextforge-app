"use client";

import { Badge } from "@repo/design-system/components/ui/fluid-badge";

export const StudentStatusBadge = ({
  status,
}: {
  readonly status: string;
}) => {
  const isActive = status === "ACTIVE";

  return (
    <Badge color={isActive ? "emerald" : "gray"} variant="dot">
      {isActive ? "Active" : "Archived"}
    </Badge>
  );
};
