import { requireTenantRole } from "@repo/auth/authorization";
import { getMainDomain } from "@repo/auth/domain";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { SettingsForm } from "./settings-form";

const getMainDomainUrl = () => {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${getMainDomain()}`;
};

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
      <main className="grid gap-5 p-4 pt-0">
        {tenant.role === "OWNER" ? (
          <Card className="max-w-3xl border-blue-200 bg-blue-50/50">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <h3 className="font-medium">Centre profile & billing</h3>
                <p className="text-muted-foreground text-sm">
                  Manage your centre name, URL, subscription, and billing on the
                  TLAS.MY portal.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link
                  href={`${getMainDomainUrl()}/centres/${tenant.organizationId}/settings`}
                >
                  Open centre portal
                  <ArrowUpRightIcon className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

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
