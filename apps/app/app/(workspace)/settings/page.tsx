import { requireTenantRole } from "@repo/auth/authorization";
import { getMainDomain } from "@repo/auth/domain";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
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
          currency: true,
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
      <Header page="Settings" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-0">
        {tenant.role === "OWNER" ? (
          <CardShell
            className="max-w-3xl border-blue-200"
            panelClassName="bg-blue-50/50"
          >
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <h3 className="font-medium">Centre profile & billing</h3>
                <p className="text-muted-foreground text-sm">
                  Manage your centre name, URL, subscription, and billing on the
                  {appName} portal.
                </p>
              </div>
              <Button
                render={
                  <Link
                    href={`${getMainDomainUrl()}/centres/${tenant.organizationId}/settings`}
                  />
                }
                variant="secondary"
              >
                Open centre portal
                <ArrowUpRightIcon className="ml-2 size-4" />
              </Button>
            </CardContent>
          </CardShell>
        ) : null}

        <CardShell className="max-w-3xl">
          <CardHeader>
            <CardTitle>Centre settings</CardTitle>
            <CardDescription>
              These details appear on invoices, receipts, and billing exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm organization={organization} />
          </CardContent>
        </CardShell>
        <CardShell className="max-w-3xl">
          <CardHeader>
            <CardTitle>Academic levels</CardTitle>
            <CardDescription>
              Manage the class levels and student years used across your centre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/academic-levels" />}
              variant="secondary"
            >
              Manage academic levels
            </Button>
          </CardContent>
        </CardShell>
      </main>
    </>
  );
};

export default SettingsPage;
