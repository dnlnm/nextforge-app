import { buildWorkspaceUrl } from "@repo/auth/domain";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";

interface WorkspaceCardProperties {
  readonly imageUrl: string | null;
  readonly name: string;
  readonly role: "ADMIN" | "TEACHER";
  readonly slug: string;
  readonly stats: {
    readonly classes: number;
    readonly students: number;
  };
}

const roleVariant: Record<
  WorkspaceCardProperties["role"],
  "outline" | "secondary"
> = {
  ADMIN: "secondary",
  TEACHER: "outline",
};

export const WorkspaceCard = ({
  imageUrl,
  name,
  role,
  slug,
  stats,
}: WorkspaceCardProperties) => {
  const workspaceUrl = buildWorkspaceUrl(slug);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {imageUrl ? (
              <Image
                alt={name}
                className="size-12 shrink-0 rounded object-cover"
                height={48}
                src={imageUrl}
                unoptimized
                width={48}
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded bg-primary font-semibold text-lg text-primary-foreground">
                {name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg">{name}</CardTitle>
              <p className="truncate text-muted-foreground text-sm">
                {slug}.tlas.my
              </p>
            </div>
          </div>
          <Badge className="shrink-0" variant={roleVariant[role]}>
            {role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="font-semibold text-2xl">{stats.students}</p>
            <p className="text-muted-foreground text-xs">Students</p>
          </div>
          <div>
            <p className="font-semibold text-2xl">{stats.classes}</p>
            <p className="text-muted-foreground text-xs">Classes</p>
          </div>
        </div>
        <Button asChild className="mt-auto w-full" size="lg">
          <a href={workspaceUrl}>
            Open Workspace
            <ExternalLinkIcon className="ml-2 size-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
