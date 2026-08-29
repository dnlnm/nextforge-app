import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { cn } from "@repo/design-system/lib/utils";
import {
  type AttentionIconKey,
  type AttentionSeverity,
  getNeedsAttentionData,
} from "@repo/domain";
import {
  BanknoteIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClockIcon,
  PresentationIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";

interface NeedsAttentionCardProps {
  readonly organizationId: string;
}

const ICON_BY_KEY: Record<AttentionIconKey, typeof ClockIcon> = {
  BANKNOTE: BanknoteIcon,
  CHALKBOARD: PresentationIcon,
  CLOCK: ClockIcon,
  STUDENTS: UsersRoundIcon,
};

const SEVERITY_STYLES: Record<
  AttentionSeverity,
  { badge: "destructive" | "info" | "warning"; icon: string }
> = {
  INFO: { badge: "info", icon: "bg-info/12 text-info" },
  URGENT: { badge: "destructive", icon: "bg-destructive/12 text-destructive" },
  WARNING: { badge: "warning", icon: "bg-warning/14 text-warning" },
};

export const NeedsAttentionCard = async ({
  organizationId,
}: NeedsAttentionCardProps) => {
  const { items } = await getNeedsAttentionData(database, organizationId);

  return (
    <PreviewCard
      className="flex h-full flex-col"
      header={
        <span className="font-medium text-foreground text-sm">
          Needs Attention
        </span>
      }
      stageClassName="min-h-0 flex-1 justify-start p-1 sm:p-1"
    >
      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleCheckIcon className="size-4.5 text-success" />
            </EmptyMedia>
            <EmptyTitle>You&apos;re all caught up</EmptyTitle>
            <EmptyDescription>
              Nothing needs your attention right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid min-h-0 gap-1 overflow-y-auto">
          {items.map((item, index) => {
            const Icon = ICON_BY_KEY[item.icon];
            const severity = SEVERITY_STYLES[item.severity];

            return (
              <Link
                aria-label={`${item.title}: ${item.description}`}
                className={cn(
                  "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                  index !== items.length - 1 && "rounded-none border-b"
                )}
                href={item.href}
                key={item.id}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md border",
                    severity.icon
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {item.title}
                  </span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {item.description}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {item.count !== undefined ? (
                    <Badge variant={severity.badge}>{item.count}</Badge>
                  ) : null}
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </PreviewCard>
  );
};
