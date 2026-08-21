import { Button } from "@repo/design-system/components/ui/button";
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { MegaphoneIcon } from "lucide-react";

export const AnnouncementsCard = () => (
  <CardShell className="h-full">
    <CardHeader>
      <CardTitle>Announcements</CardTitle>
      <CardAction>
        <Button disabled size="sm" variant="link">
          View All
        </Button>
      </CardAction>
    </CardHeader>
    <CardContent className="flex min-h-0 flex-1 flex-col">
      <Empty>
        <EmptyContent>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MegaphoneIcon className="size-4.5" />
            </EmptyMedia>
            <EmptyTitle>No announcements</EmptyTitle>
            <EmptyDescription>
              Centre notices and announcements will appear here.
            </EmptyDescription>
          </EmptyHeader>
          <Button disabled size="sm">
            Create Announcement
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </CardShell>
);
