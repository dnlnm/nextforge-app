import { requireTenantRole } from "@repo/auth/authorization";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import Link from "next/link";
import { Header } from "../components/header";
import { generateMonthlyInvoices } from "./actions";

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const currentBillingMonth = () => new Date().toISOString().slice(0, 7);

const InvoicesPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const invoices = await database.invoice.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: [{ billingMonth: "desc" }, { invoiceNumber: "desc" }],
    include: { lineItems: true, student: true },
    take: 100,
  });
  const totalOutstandingSen = invoices.reduce(
    (sum, invoice) => sum + (invoice.totalSen - invoice.amountPaidSen),
    0
  );

  return (
    <>
      <Header page="Invoices" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Generate monthly invoices</CardTitle>
            <CardDescription>
              Creates one invoice per active student based on active class
              enrolments that have started. Students whose enrollment date is
              after the billing month are skipped. Existing invoices for the
              same month are not recreated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateMonthlyInvoices} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingMonth">Billing month</Label>
                <Input
                  defaultValue={currentBillingMonth()}
                  id="billingMonth"
                  name="billingMonth"
                  required
                  type="month"
                />
              </div>
              <Button type="submit">Generate invoices</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {invoices.length} invoices - {formatMoney(totalOutstandingSen)}
              outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.billingMonth}</TableCell>
                    <TableCell>{invoice.student.fullName}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell>{formatMoney(invoice.totalSen)}</TableCell>
                    <TableCell>{formatMoney(invoice.amountPaidSen)}</TableCell>
                    <TableCell>
                      {formatMoney(invoice.totalSen - invoice.amountPaidSen)}
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

export default InvoicesPage;
