import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardFrameAction,
  CardFrameHeader,
  CardFrameTitle,
} from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Stat } from "@repo/design-system/components/ui/stat";
import { MegaphoneIcon } from "lucide-react";

export const AnnouncementsCard = () => (
  <Stat className="isolate h-full after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 dark:bg-background">
    <CardFrameHeader>
      <CardFrameTitle className="text-base">Announcements</CardFrameTitle>
      <CardFrameAction>
        <Button disabled size="sm" variant="link">
          View All
        </Button>
      </CardFrameAction>
    </CardFrameHeader>
    <Card className="min-h-0 flex-1 flex-col dark:bg-background">
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
    </Card>
  </Stat>
);
