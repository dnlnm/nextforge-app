import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Header } from "../../components/header";
import { reversePayment } from "../actions";

interface PaymentPageProperties {
  readonly params: Promise<{ paymentId: string }>;
}

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export const generateMetadata = async ({
  params,
}: PaymentPageProperties): Promise<Metadata> => {
  const { paymentId } = await params;

  return { title: `Receipt ${paymentId} - TLAS.MY` };
};

const PaymentPage = async ({ params }: PaymentPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { paymentId } = await params;
  const payment = await database.payment.findFirst({
    where: { id: paymentId, organizationId: tenant.organizationId },
    include: {
      allocations: { include: { invoice: true } },
      organization: { include: { settings: true } },
      student: true,
    },
  });

  if (!payment) {
    notFound();
  }

  const allocatedSen = payment.allocations.reduce(
    (sum, allocation) => sum + allocation.amountSen,
    0
  );

  return (
    <>
      <div className="print:hidden">
        <Header page={payment.receiptNumber} pages={["Payments"]}>
          <div className="flex gap-2 pr-4">
            <Button asChild variant="outline">
              <Link href="/payments">Back</Link>
            </Button>
            <PrintButton />
            {payment.status === "RECORDED" ? (
              <form action={reversePayment}>
                <input name="paymentId" type="hidden" value={payment.id} />
                <Button type="submit" variant="outline">
                  Reverse
                </Button>
              </form>
            ) : null}
          </div>
        </Header>
      </div>
      <main className="mx-auto grid max-w-3xl gap-4 p-4 pt-0 print:p-0">
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="grid gap-6 md:grid-cols-2">
            <div>
              <CardTitle className="text-2xl">Receipt</CardTitle>
              <p className="mt-2 font-semibold">{payment.receiptNumber}</p>
              <Badge className="mt-2">{payment.status}</Badge>
            </div>
            <div className="text-left md:text-right">
              <p className="font-semibold">{payment.organization.name}</p>
              <p className="text-muted-foreground text-sm">
                {payment.organization.settings?.email ?? ""}
              </p>
              <p className="text-muted-foreground text-sm">
                {payment.organization.settings?.phone ?? ""}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="font-medium">Received from</h2>
                <p>{payment.student.fullName}</p>
              </div>
              <div className="grid gap-1 md:text-right">
                <p>Payment date: {formatDate(payment.paidAt)}</p>
                <p>Method: {payment.method}</p>
                <p>Reference: {payment.reference ?? "-"}</p>
              </div>
            </section>
            <section className="rounded-lg border p-4">
              <div className="flex justify-between font-semibold text-xl">
                <span>Amount received</span>
                <span>{formatMoney(payment.amountSen)}</span>
              </div>
            </section>
            <section>
              <h2 className="mb-2 font-medium">Applied to invoices</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Billing month</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>{allocation.invoice.invoiceNumber}</TableCell>
                      <TableCell>{allocation.invoice.billingMonth}</TableCell>
                      <TableCell>{formatMoney(allocation.amountSen)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
            <section className="ml-auto grid w-full max-w-sm gap-2">
              <div className="flex justify-between">
                <span>Allocated</span>
                <span>{formatMoney(allocatedSen)}</span>
              </div>
              <div className="flex justify-between">
                <span>Unallocated</span>
                <span>{formatMoney(payment.amountSen - allocatedSen)}</span>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default PaymentPage;
