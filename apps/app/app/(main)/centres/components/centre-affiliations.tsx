import { buildWorkspaceUrl } from "@repo/auth/domain";
import { formatWorkspaceHostname } from "@repo/config/brand";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { Card } from "@repo/design-system/components/ui/fluid-card";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";

export interface CentreAffiliationItem {
  readonly id: string;
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly imageUrl: string | null;
    readonly _count: {
      readonly students: number;
      readonly classes: number;
    };
  };
  readonly role: "ADMIN" | "TEACHER";
}

export interface CentreAffiliationsProps {
  readonly affiliations: readonly CentreAffiliationItem[];
}

export const CentreAffiliations = ({
  affiliations,
}: CentreAffiliationsProps) => {
  if (affiliations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="font-semibold text-foreground text-lg tracking-tight">
          Other Centres & Affiliations
        </h3>
        <p className="text-muted-foreground text-sm">
          Centres where you participate as an administrator or teacher
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {affiliations.map(({ id, role, organization }) => {
          const workspaceUrl = buildWorkspaceUrl(organization.slug);
          const hostname = formatWorkspaceHostname(organization.slug);

          return (
            <Card
              className="flex flex-col justify-between overflow-hidden border-border/80 p-4 shadow-xs"
              key={id}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {organization.imageUrl ? (
                      <Image
                        alt={organization.name}
                        className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                        height={40}
                        src={organization.imageUrl}
                        unoptimized
                        width={40}
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-foreground text-sm ring-1 ring-border/50">
                        {organization.name[0]?.toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-foreground text-sm">
                        {organization.name}
                      </h4>
                      <p className="truncate text-muted-foreground text-xs">
                        {hostname}
                      </p>
                    </div>
                  </div>

                  <Badge
                    color={role === "ADMIN" ? "blue" : "purple"}
                    size="compact"
                    variant="solid"
                  >
                    {role}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  <span>{organization._count.students} students</span>
                  <span>•</span>
                  <span>{organization._count.classes} classes</span>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <Button
                  asChild
                  className="w-full"
                  size="compact"
                  variant="secondary"
                >
                  <a
                    aria-label={`Open ${organization.name} workspace`}
                    href={workspaceUrl}
                  >
                    Open Workspace
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
