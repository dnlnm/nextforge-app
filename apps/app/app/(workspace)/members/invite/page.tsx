import { appName } from "@repo/config/brand";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { MailPlusIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { inviteAdmin } from "../actions";

const InviteAdminPage = () => (
  <>
    <Header
      page="Invite Admin"
      pages={[`${appName}`, { href: "/members", label: "Members" }]}
    />
    <main className="grid gap-5 p-4 pt-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Invite Admin</h1>
        <p className="text-muted-foreground text-sm">
          Send an email invitation to a new admin. They&apos;ll sign in with the
          same email and help manage your centre.
        </p>
      </div>

      <form action={inviteAdmin} className="grid max-w-xl content-start gap-5">
        <CardShell>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <ShieldCheckIcon className="size-5 text-muted-foreground" />
              Invitation details
            </CardTitle>
            <CardDescription>
              The admin will receive an email with a link to accept.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Ahmad Hakimi Bin Ali"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                placeholder="e.g. admin@email.com"
                required
                type="email"
              />
            </div>
          </CardContent>
        </CardShell>

        <div className="flex gap-3">
          <Button render={<Link href="/members" />} size="lg" variant="outline">
            Cancel
          </Button>
          <Button className="flex-1" size="lg" type="submit">
            <MailPlusIcon className="size-4" />
            Send invitation
          </Button>
        </div>
      </form>
    </main>
  </>
);

export default InviteAdminPage;
