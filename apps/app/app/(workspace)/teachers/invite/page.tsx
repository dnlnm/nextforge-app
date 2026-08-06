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
import { MailPlusIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { inviteTeacher } from "../actions";

const InviteTeacherPage = () => (
  <>
    <Header
      page="Invite Teacher"
      pages={["TLAS.MY", { href: "/teachers", label: "Teachers" }]}
    />
    <main className="grid gap-5 p-4 pt-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Invite Teacher
        </h1>
        <p className="text-muted-foreground text-sm">
          Send an email invitation to a new teacher. They&apos;ll sign in with
          the same email and join your centre.
        </p>
      </div>

      <form
        action={inviteTeacher}
        className="grid max-w-xl content-start gap-5"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <UserRoundIcon className="size-5 text-muted-foreground" />
              Invitation details
            </CardTitle>
            <CardDescription>
              The teacher will receive an email with a link to accept.
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
                placeholder="e.g. teacher@email.com"
                required
                type="email"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button asChild size="lg" variant="outline">
            <Link href="/teachers">Cancel</Link>
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

export default InviteTeacherPage;
