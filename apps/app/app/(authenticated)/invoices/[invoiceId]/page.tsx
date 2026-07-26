import { requireTenant } from "@repo/auth/authorization";
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

interface InvoicePageProperties {
  readonly params: Promise<{ invoiceId: string }>;
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
}: InvoicePageProperties): Promise<Metadata> => {
  const { invoiceId } = await params;

  return { title: `Invoice ${invoiceId} - TLAS.MY` };
};

const InvoicePage = async ({ params }: InvoicePageProperties) => {
  const tenant = await requireTenant();
  const { invoiceId } = await params;
  const invoice = await database.invoice.findFirst({
    where: { id: invoiceId, organizationId: tenant.organizationId },
    include: {
      allocations: { include: { payment: true } },
      lineItems: true,
      organization: { include: { settings: true } },
      student: {
        include: {
          guardians: {
            where: { isPrimary: true },
            include: { guardian: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const guardian = invoice.student.guardians.at(0)?.guardian;
  const outstandingSen = invoice.totalSen - invoice.amountPaidSen;

  return (
    <>
      <div className="print:hidden">
        <Header page={invoice.invoiceNumber} pages={["Invoices"]}>
          <div className="flex gap-2 pr-4">
            <Button asChild variant="outline">
              <Link href="/invoices">Back</Link>
            </Button>
            <PrintButton />
          </div>
        </Header>
      </div>
      <main className="mx-auto grid max-w-4xl gap-4 p-4 pt-0 print:p-0">
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="grid gap-6 md:grid-cols-2">
            <div>
              <CardTitle className="text-2xl">Invoice</CardTitle>
              <p className="mt-2 font-semibold">{invoice.invoiceNumber}</p>
              <Badge className="mt-2">{invoice.status}</Badge>
            </div>
            <div className="text-left md:text-right">
              <p className="font-semibold">{invoice.organization.name}</p>
              <p className="text-muted-foreground text-sm">
                {invoice.organization.settings?.addressLine1 ?? ""}
              </p>
              <p className="text-muted-foreground text-sm">
                {[
                  invoice.organization.settings?.postcode,
                  invoice.organization.settings?.city,
                  invoice.organization.settings?.state,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              <p className="text-muted-foreground text-sm">
                {invoice.organization.settings?.email ?? ""}
              </p>
              <p className="text-muted-foreground text-sm">
                {invoice.organization.settings?.phone ?? ""}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="font-medium">Bill to</h2>
                <p>{invoice.student.fullName}</p>
                <p className="text-muted-foreground text-sm">
                  {guardian?.fullName ?? "No primary guardian"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {guardian?.phone ?? guardian?.email ?? ""}
                </p>
              </div>
              <div className="grid gap-1 md:text-right">
                <p>Billing month: {invoice.billingMonth}</p>
                <p>Issue date: {formatDate(invoice.issueDate)}</p>
                <p>Due date: {formatDate(invoice.dueDate)}</p>
              </div>
            </section>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatMoney(item.unitPriceSen)}</TableCell>
                    <TableCell>{formatMoney(item.totalSen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <section className="ml-auto grid w-full max-w-sm gap-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(invoice.subtotalSen)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{formatMoney(invoice.amountPaidSen)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                <span>Outstanding</span>
                <span>{formatMoney(outstandingSen)}</span>
              </div>
            </section>
            {invoice.allocations.length > 0 ? (
              <section>
                <h2 className="mb-2 font-medium">Payments</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.allocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          {allocation.payment.receiptNumber}
                        </TableCell>
                        <TableCell>
                          {formatDate(allocation.payment.paidAt)}
                        </TableCell>
                        <TableCell>{allocation.payment.method}</TableCell>
                        <TableCell>
                          {formatMoney(allocation.amountSen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            ) : null}
            {invoice.organization.settings?.paymentInstructions ? (
              <section className="rounded-lg border p-4">
                <h2 className="mb-2 font-medium">Payment instructions</h2>
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {invoice.organization.settings.paymentInstructions}
                </p>
              </section>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default InvoicePage;
