import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { formatMonthShort, getMalaysiaCalendarDate } from "@repo/date";
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
  AlertTriangleIcon,
  CircleDollarSignIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../components/header";
import { getInvoiceFilterOptions, getInvoicesForTable } from "./actions";
import { GenerateInvoicesDialog } from "./generate-invoices-dialog";
import { InvoicesPageClient } from "./invoices-page-client";

// Default billing month is the current Asia/Kuala_Lumpur calendar month (keeps
// the machine `yyyy-MM` format) rather than the server/UTC month.
const currentBillingMonth = () => getMalaysiaCalendarDate().slice(0, 7);

const currentBillingMonthLabel = () => {
  const [year, month] = currentBillingMonth().split("-").map(Number);
  return formatMonthShort(new Date(Date.UTC(year, month - 1, 1)));
};

const InvoicesPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const currency = await getOrganizationCurrency(tenant.organizationId);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  const [
    initialTableData,
    filterOptions,
    statusCounts,
    monthAgg,
    overdueAgg,
    outstandingAgg,
  ] = await Promise.all([
    getInvoicesForTable({ page: 0, pageSize: 10 }),
    getInvoiceFilterOptions(),
    database.invoice.groupBy({
      _count: { id: true },
      by: ["status"],
      where: { organizationId: tenant.organizationId },
    }),
    database.invoice.aggregate({
      _count: { id: true },
      _sum: { amountPaidSen: true, totalSen: true },
      where: {
        billingMonth: currentBillingMonth(),
        organizationId: tenant.organizationId,
      },
    }),
    database.invoice.aggregate({
      _sum: { amountPaidSen: true, totalSen: true },
      where: {
        organizationId: tenant.organizationId,
        status: "OVERDUE",
      },
    }),
    database.invoice.aggregate({
      _sum: { amountPaidSen: true, totalSen: true },
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((group) => [group.status, group._count.id])
  );
  const billedSen = monthAgg._sum?.totalSen ?? 0;
  const collectedSen = monthAgg._sum?.amountPaidSen ?? 0;
  const billedCount = monthAgg._count.id;
  const collectionRate =
    billedSen > 0 ? Math.round((collectedSen / billedSen) * 100) : 0;
  const overdueAmt = Math.max(
    0,
    (overdueAgg._sum?.totalSen ?? 0) - (overdueAgg._sum?.amountPaidSen ?? 0)
  );
  const overdueCount = countByStatus.OVERDUE ?? 0;
  const totalOutstandingSen = Math.max(
    0,
    (outstandingAgg._sum?.totalSen ?? 0) -
      (outstandingAgg._sum?.amountPaidSen ?? 0)
  );

  return (
    <>
      <Header page="Invoices" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Invoices</h1>
            <p className="text-muted-foreground text-sm">
              Track tuition fees, generate monthly invoices, and monitor
              collection across all students.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueCount > 0 && (
              <Button
                className="flex-1 border-destructive/20 bg-destructive/8 text-destructive hover:bg-destructive/12 hover:text-destructive md:flex-none"
                render={<Link href="/invoices?status=OVERDUE" />}
                variant="outline"
              >
                <AlertTriangleIcon className="size-4" />
                {overdueCount} overdue
              </Button>
            )}
            <Button
              className="flex-1 md:flex-none"
              render={<Link href="/reports/exports/invoices" />}
              variant="outline"
            >
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <GenerateInvoicesDialog
              defaultBillingMonth={currentBillingMonth()}
            />
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat>
            <StatPanel>
              <StatLabel>Billed ({currentBillingMonthLabel()})</StatLabel>
              <StatIndicator color="info" variant="icon">
                <FileTextIcon />
              </StatIndicator>
              <StatValue>{formatMoney(billedSen)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>
                {billedCount} invoices this month
              </StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Collected ({currentBillingMonthLabel()})</StatLabel>
              <StatIndicator color="success" variant="icon">
                <CircleDollarSignIcon />
              </StatIndicator>
              <StatValue>{formatMoney(collectedSen)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>
                {collectionRate}% collection rate
              </StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Outstanding</StatLabel>
              <StatIndicator color="default" variant="icon">
                <ClockIcon />
              </StatIndicator>
              <StatValue>{formatMoney(totalOutstandingSen)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>Pending payments</StatDescription>
            </StatFooter>
          </Stat>
          <Stat>
            <StatPanel>
              <StatLabel>Overdue</StatLabel>
              <StatIndicator
                color={overdueAmt > 0 ? "error" : "default"}
                variant="icon"
              >
                <AlertTriangleIcon />
              </StatIndicator>
              <StatValue>{formatMoney(overdueAmt)}</StatValue>
            </StatPanel>
            <StatFooter>
              <StatDescription>
                {overdueCount} invoice{overdueCount !== 1 ? "s" : ""} past due
              </StatDescription>
            </StatFooter>
          </Stat>
        </section>

        <InvoicesPageClient
          currency={currency}
          filterOptions={filterOptions}
          initialData={initialTableData.data}
          initialTotalCount={initialTableData.totalCount}
          statusCounts={{ all: initialTableData.totalCount, ...countByStatus }}
        />
      </main>
    </>
  );
};

export default InvoicesPage;
