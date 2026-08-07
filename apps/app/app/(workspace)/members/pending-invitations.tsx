import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { MailXIcon } from "lucide-react";
import { getPendingAdminInvitations, revokeAdminInvitation } from "./actions";

export const PendingAdminInvitations = async () => {
  const invitations = await getPendingAdminInvitations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <MailXIcon className="size-5 text-muted-foreground" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Admins who haven&apos;t accepted their invitation yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No pending invitations.
          </p>
        ) : (
          <ul className="divide-y">
            {invitations.map((invitation) => (
              <li
                className="flex items-center justify-between gap-4 py-3"
                key={invitation.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {invitation.fullName}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {invitation.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {invitation.expiresInDays}d left
                  </span>
                  <form action={revokeAdminInvitation}>
                    <input
                      name="invitationId"
                      type="hidden"
                      value={invitation.id}
                    />
                    <Button size="sm" type="submit" variant="outline">
                      Revoke
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
