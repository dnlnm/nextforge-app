import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
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
import { FluidPanel } from "@repo/design-system/components/fluid-panel";
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
    <FluidPanel
      className="flex h-full flex-col"
      header={
        <>
          <span className="font-medium text-foreground text-sm">
            Fee Collection (This Month)
          </span>
          <Button render={<Link href="/reports" />} size="sm" variant="link">
            View Report
          </Button>
        </>
      }
      stageClassName="min-h-0 flex-1 justify-start p-1 sm:p-1"
    >
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
    </FluidPanel>
  );
};
