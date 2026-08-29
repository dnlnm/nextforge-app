import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { SendIcon, UserRoundPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../components/header";
import { getMembers } from "./actions";
import { PendingAdminInvitations } from "./pending-invitations";
import { TeacherPendingInvitations } from "./teacher-pending-invitations";

export const metadata: Metadata = {
  title: "Members",
};

const NAME_SEPARATOR = /\s+/;

const getInitials = (fullName: string, email?: string | null) => {
  const name = fullName.trim();

  if (name) {
    return name
      .split(NAME_SEPARATOR)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (email ?? "?").slice(0, 2).toUpperCase();
};

const roleBadge = (
  role: "OWNER" | "ADMIN" | "TEACHER"
): { label: string; variant: "default" | "secondary" | "outline" } => {
  if (role === "OWNER") {
    return { label: "Owner", variant: "default" };
  }

  if (role === "ADMIN") {
    return { label: "Admin", variant: "secondary" };
  }

  return { label: "Teacher", variant: "outline" };
};

const MembersPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const isOwner = tenant.role === "OWNER";
  const members = await getMembers();

  return (
    <>
      <Header page="Members" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Members</h1>
            <p className="text-muted-foreground text-sm">
              Manage the admins and teachers who help run your centre.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 md:flex-none"
              render={<Link href="/members/invite-teacher" />}
            >
              <UserRoundPlusIcon className="size-4" />
              <span className="hidden sm:inline">Invite Teacher</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            {isOwner ? (
              <Button
                className="flex-1 md:flex-none"
                render={<Link href="/members/invite" />}
                variant="outline"
              >
                <SendIcon className="size-4" />
                <span className="hidden sm:inline">Invite Admin</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            ) : null}
          </div>
        </div>

        <TeacherPendingInvitations />
        {isOwner ? <PendingAdminInvitations /> : null}

        <CardShell>
          <CardHeader>
            <CardTitle>Current Members</CardTitle>
            <CardDescription>
              Owners, admins, and teachers with access to this centre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">No members found.</p>
            ) : (
              <ul className="divide-y">
                {members.map((member) => {
                  const badge = roleBadge(member.role);

                  return (
                    <li
                      className="flex items-center justify-between gap-4 py-3"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            alt={member.fullName || member.email || undefined}
                            src={member.imageUrl ?? undefined}
                          />
                          <AvatarFallback>
                            {getInitials(member.fullName, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">
                            {member.fullName ||
                              member.firstName ||
                              member.email}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </CardShell>
      </main>
    </>
  );
};

export default MembersPage;