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
import Link from "next/link";
import { Header } from "../components/header";
import { SettingsForm } from "./settings-form";

const SettingsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const organization = await database.organization.findUnique({
    where: { id: tenant.organizationId },
    select: {
      imageUrl: true,
      name: true,
      settings: {
        select: {
          addressLine1: true,
          addressLine2: true,
          city: true,
          defaultInvoiceDueDay: true,
          email: true,
          invoicePrefix: true,
          paymentInstructions: true,
          phone: true,
          postcode: true,
          receiptPrefix: true,
          state: true,
        },
      },
    },
  });

  return (
    <>
      <Header page="Settings" pages={["TLAS.MY"]} />
      <main className="p-4 pt-0">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Centre settings</CardTitle>
            <CardDescription>
              These details appear on invoices, receipts, and billing exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm organization={organization} />
          </CardContent>
        </Card>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Academic levels</CardTitle>
            <CardDescription>
              Manage the class levels and student years used across your centre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/academic-levels">Manage academic levels</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SettingsPage;
