import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import { type FeeCollectionPoint, getFeeCollectionData } from "@repo/domain";
import { formatMoneyWhole } from "@repo/money";
import { ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { FeeCollectionChart } from "./fee-collection-chart";

interface FeeCollectionCardProps {
  readonly currency: string;
  readonly organizationId: string;
}

export const FeeCollectionCard = async ({
  currency,
  organizationId,
}: FeeCollectionCardProps) => {
  const formatMoney = (amountSen: number) =>
    formatMoneyWhole(amountSen, { currency });
  const data = await getFeeCollectionData(database, organizationId);
  const hasTarget = data.invoicedSen > 0;
  const trend: FeeCollectionPoint[] = data.trend;

  return (
    <CardShell className="h-full">
      <CardHeader>
        <CardTitle>Fee Collection (This Month)</CardTitle>
        <CardAction>
          <Button render={<Link href="/reports" />} size="sm" variant="link">
            View Report
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {hasTarget ? (
          <>
            <div className="mb-3 shrink-0">
              <p className="text-muted-foreground text-sm">Total Collected</p>
              <div className="mt-1">
                <p className="font-semibold text-3xl tracking-tight">
                  {formatMoney(data.collectedSen)}
                </p>
              </div>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {data.targetPercent}% of {formatMoney(data.invoicedSen)}{" "}
                    target
                  </span>
                  <Badge variant="outline">
                    Outstanding {formatMoney(data.outstandingSen)}
                  </Badge>
                </div>
                <Progress
                  aria-label={`${data.targetPercent}% of target collected`}
                  value={data.targetPercent}
                >
                  <ProgressTrack>
                    <ProgressIndicator
                      className="bg-success"
                      style={{
                        width: `${Math.min(100, data.targetPercent)}%`,
                      }}
                    />
                  </ProgressTrack>
                </Progress>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                {data.overdueCount > 0
                  ? `${data.overdueCount} ${data.overdueCount === 1 ? "invoice" : "invoices"} overdue`
                  : "No overdue invoices"}
              </p>
            </div>
            <FeeCollectionChart currency={currency} data={trend} />
          </>
        ) : (
          <Empty>
            <EmptyContent>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptTextIcon className="size-4.5" />
                </EmptyMedia>
                <EmptyTitle>No fees invoiced yet</EmptyTitle>
                <EmptyDescription>
                  Generate monthly invoices to start tracking fee collection
                  here.
                </EmptyDescription>
              </EmptyHeader>
              <Button render={<Link href="/invoices" />} size="sm">
                Generate Invoices
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </CardShell>
  );
};
