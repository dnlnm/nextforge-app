import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { getMalaysiaToday } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { formatMoney as formatMoneyShared } from "@repo/money";
import {
  ArrowUpRightIcon,
  CircleDollarSignIcon,
  ClockIcon,
  DownloadIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import Link from "next/link";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../components/header";
import { getPaymentFilterOptions, getPaymentsForTable } from "./actions";
import { PaymentsPageClient } from "./payments-page-client";

const startOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const startOfNextMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

const PaymentsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const currency = await getOrganizationCurrency(tenant.organizationId);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  // "Business today" is the Asia/Kuala_Lumpur calendar day; month bounds are
  // the UTC-midnight instants of the Malaysia calendar month (AGENTS.md).
  const today = getMalaysiaToday();
  const monthStart = startOfMonth(today);
  const nextMonthStart = startOfNextMonth(today);

  const [initialTableData, filterOptions, monthAgg, statusCounts, avgAgg] =
    await Promise.all([
      getPaymentsForTable({ page: 0, pageSize: 10 }),
      getPaymentFilterOptions(),
      database.payment.aggregate({
        _count: { id: true },
        _sum: { amountSen: true },
        where: {
          organizationId: tenant.organizationId,
          paidAt: { gte: monthStart, lt: nextMonthStart },
          status: { in: ["RECORDED", "VERIFIED"] },
        },
      }),
      database.payment.groupBy({
        _count: { id: true },
        by: ["status"],
        where: { organizationId: tenant.organizationId },
      }),
      database.payment.aggregate({
        _avg: { amountSen: true },
        where: { organizationId: tenant.organizationId },
      }),
    ]);

  const collectedSen = monthAgg._sum?.amountSen ?? 0;
  const collectedCount = monthAgg._count.id;
  const countByStatus = Object.fromEntries(
    statusCounts.map((group) => [group.status, group._count.id])
  );
  const avgSen = Math.round(avgAgg._avg?.amountSen ?? 0);

  return (
    <>
      <Header page="Payments" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Payments</h1>
            <p className="text-muted-foreground text-sm">
              All manually recorded payments — cash, transfers, DuitNow, FPX,
              and card.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 md:flex-none"
              render={<Link href="/reports/exports/payments" />}
              variant="outline"
            >
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <Button
              className="flex-1 md:flex-none"
              render={<Link href="/payments/new" />}
            >
              <PlusIcon className="size-4" />
              Record payment
            </Button>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat>
            <StatPanel>
              <StatLabel>Collected</StatLabel>
              <StatIndicator color="success" variant="icon">
                <CircleDollarSignIcon />
              </StatIndicator>
              <StatValue>{formatMoney(collectedSen)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>
                {collectedCount} transactions this month
              </StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Pending Verification</StatLabel>
              <StatIndicator color="warning" variant="icon">
                <ClockIcon />
              </StatIndicator>
              <StatValue>
                {(countByStatus.RECORDED ?? 0).toLocaleString()}
              </StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Awaiting review</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Reversed</StatLabel>
              <StatIndicator color="default" variant="icon">
                <RotateCcwIcon />
              </StatIndicator>
              <StatValue>
                {(countByStatus.REVERSED ?? 0).toLocaleString()}
              </StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Voided payments</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Avg. Payment</StatLabel>
              <StatIndicator color="info" variant="icon">
                <ArrowUpRightIcon />
              </StatIndicator>
              <StatValue>{formatMoney(avgSen)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Per transaction</StatDescription>
            </StatFooter>
          </Stat>
        </section>

        <PaymentsPageClient
          currency={currency}
          filterOptions={filterOptions}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          statusCounts={countByStatus}
        />
      </main>
    </>
  );
};

export default PaymentsPage;
