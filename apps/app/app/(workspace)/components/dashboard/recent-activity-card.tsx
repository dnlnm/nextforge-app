import { database } from "@repo/database";
import { formatRelativeTime } from "@repo/date";
import {
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
} from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { cn } from "@repo/design-system/lib/utils";
import { type ActivityIconKey, getRecentActivityData } from "@repo/domain";
import {
  BanknoteIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  ReceiptTextIcon,
  UserRoundIcon,
} from "lucide-react";

interface RecentActivityCardProps {
  readonly organizationId: string;
}

const ICON_BY_KEY: Record<ActivityIconKey, typeof ReceiptTextIcon> = {
  ACTIVITY: ReceiptTextIcon,
  ATTENDANCE: ClipboardCheckIcon,
  ENROLLMENT: GraduationCapIcon,
  INVOICE: FileTextIcon,
  PAYMENT: BanknoteIcon,
  STUDENT: UserRoundIcon,
};

export const RecentActivityCard = async ({
  organizationId,
}: RecentActivityCardProps) => {
  const { items } = await getRecentActivityData(database, organizationId);

  return (
    <CardFrame className="h-full">
      <CardFrameHeader>
        <CardFrameTitle>Recent Activity</CardFrameTitle>
      </CardFrameHeader>
      <Card className="flex-1">
        <CardContent className="flex min-h-0 flex-col">
          {items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptTextIcon className="size-4.5" />
                </EmptyMedia>
                <EmptyTitle>No recent activity</EmptyTitle>
                <EmptyDescription>
                  Centre activity will appear here as your team starts using
                  KLIO.MY.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-1">
              {items.map((item, index) => {
                const Icon = ICON_BY_KEY[item.icon];

                return (
                  <div
                    className={cn(
                      "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 py-3 text-sm",
                      index !== items.length - 1 && "border-b"
                    )}
                    key={item.id}
                  >
                    <span className="flex size-9 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <p className="truncate font-medium leading-5">
                      {item.summary}
                    </p>
                    <p className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </CardFrame>
  );
};
