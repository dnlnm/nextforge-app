import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import Link from "next/link";
import { Header } from "../components/header";
import { recordPayment } from "./actions";

const methods = [
  ["CASH", "Cash"],
  ["BANK_TRANSFER", "Bank transfer"],
  ["DUITNOW", "DuitNow"],
  ["FPX", "FPX"],
  ["CARD", "Card"],
  ["OTHER", "Other"],
] as const;

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const PaymentsPage = async () => {
  const tenant = await requireTenant();
  const [openInvoices, payments] = await Promise.all([
    database.invoice.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
      orderBy: [{ billingMonth: "desc" }, { invoiceNumber: "asc" }],
      include: { student: true },
    }),
    database.payment.findMany({
      where: { organizationId: tenant.organizationId },
      orderBy: { paidAt: "desc" },
      include: { allocations: { include: { invoice: true } }, student: true },
      take: 100,
    }),
  ]);

  return (
    <>
      <Header page="Payments" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>
              Record cash, transfer, DuitNow, FPX, card, or other payments
              received outside TLAS.MY.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={recordPayment} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceId">Invoice</Label>
                <Select name="invoiceId" required>
                  <SelectTrigger id="invoiceId">
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {openInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {invoice.student.fullName} -{" "}
                        {formatMoney(invoice.totalSen - invoice.amountPaidSen)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  min="0.01"
                  name="amount"
                  required
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Method</Label>
                <Select name="method" required>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" />
              </div>
              <Button disabled={openInvoices.length === 0} type="submit">
                Record payment
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>
              {payments.length} payments recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/payments/${payment.id}`}
                      >
                        {payment.receiptNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{payment.student.fullName}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{formatMoney(payment.amountSen)}</TableCell>
                    <TableCell>
                      {payment.allocations
                        .map((allocation) => allocation.invoice.invoiceNumber)
                        .join(", ") || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default PaymentsPage;
