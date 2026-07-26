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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Header } from "../components/header";
import { updateCentreSettings } from "./actions";

const SettingsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const organization = await database.organization.findUnique({
    where: { id: tenant.organizationId },
    include: { settings: true },
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
            <form action={updateCentreSettings} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Centre name</Label>
                <Input
                  defaultValue={organization?.name}
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    defaultValue={organization?.settings?.email ?? ""}
                    id="email"
                    name="email"
                    type="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    defaultValue={organization?.settings?.phone ?? ""}
                    id="phone"
                    name="phone"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input
                  defaultValue={organization?.settings?.addressLine1 ?? ""}
                  id="addressLine1"
                  name="addressLine1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input
                  defaultValue={organization?.settings?.addressLine2 ?? ""}
                  id="addressLine2"
                  name="addressLine2"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    defaultValue={organization?.settings?.city ?? ""}
                    id="city"
                    name="city"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    defaultValue={organization?.settings?.state ?? ""}
                    id="state"
                    name="state"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    defaultValue={organization?.settings?.postcode ?? ""}
                    id="postcode"
                    name="postcode"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                  <Input
                    defaultValue={
                      organization?.settings?.invoicePrefix ?? "INV"
                    }
                    id="invoicePrefix"
                    name="invoicePrefix"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receiptPrefix">Receipt prefix</Label>
                  <Input
                    defaultValue={
                      organization?.settings?.receiptPrefix ?? "RCP"
                    }
                    id="receiptPrefix"
                    name="receiptPrefix"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defaultInvoiceDueDay">Due day</Label>
                  <Input
                    defaultValue={
                      organization?.settings?.defaultInvoiceDueDay ?? 7
                    }
                    id="defaultInvoiceDueDay"
                    max="28"
                    min="1"
                    name="defaultInvoiceDueDay"
                    required
                    type="number"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentInstructions">
                  Payment instructions
                </Label>
                <Textarea
                  defaultValue={
                    organization?.settings?.paymentInstructions ?? ""
                  }
                  id="paymentInstructions"
                  name="paymentInstructions"
                  placeholder="Bank account, DuitNow QR reference, or payment reminder notes."
                />
              </div>
              <Button type="submit">Save settings</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SettingsPage;
