import { Badge, type badgeVariants } from "@repo/design-system/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type ImportStatus =
  | "UPLOADED"
  | "VALIDATING"
  | "READY"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | string;

const statusConfig: Record<
  string,
  { label: string; chop: string; variant: BadgeVariant }
> = {
  UPLOADED: { label: "uploaded", chop: "Queued", variant: "secondary" },
  VALIDATING: { label: "validating", chop: "Checking", variant: "info" },
  READY: { label: "needs review", chop: "Review", variant: "warning" },
  PROCESSING: { label: "importing", chop: "Importing", variant: "info" },
  COMPLETED: { label: "completed", chop: "Completed", variant: "success" },
  COMPLETED_WITH_ERRORS: {
    label: "completed with errors",
    chop: "Needs fix",
    variant: "warning",
  },
  FAILED: { label: "failed", chop: "Failed", variant: "error" },
};

export const importStatusLabel = (status: string) =>
  statusConfig[status]?.label ?? status.toLowerCase().replaceAll("_", " ");

export const importStatusChop = (status: string) =>
  statusConfig[status]?.chop ?? status.replaceAll("_", " ");

export const ImportStatusChop = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  const cfg = statusConfig[status];
  return (
    <Badge
      className={className}
      variant={cfg?.variant ?? "outline"}
    >
      {cfg?.chop ?? status.replaceAll("_", " ")}
    </Badge>
  );
};
