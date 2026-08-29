import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { MegaphoneIcon } from "lucide-react";

export const AnnouncementsCard = () => (
  <PreviewCard
    className="flex h-full flex-col"
    header={
      <>
        <span className="font-medium text-foreground text-sm">
          Announcements
        </span>
        <Button disabled size="sm" variant="link">
          View All
        </Button>
      </>
    }
    stageClassName="min-h-0 flex-1 justify-start p-1 sm:p-1"
  >
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
  </PreviewCard>
);
