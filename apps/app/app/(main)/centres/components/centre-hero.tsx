import { buildWorkspaceUrl } from "@repo/auth/domain";
import { formatWorkspaceHostname } from "@repo/config/brand";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Card,
  CardContent,
} from "@repo/design-system/components/ui/fluid-card";
import { InputCopy } from "@repo/design-system/components/ui/fluid-input-copy";
import {
  CreditCardIcon,
  ExternalLinkIcon,
  MapPinIcon,
  SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface CentreHeroProps {
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly imageUrl: string | null;
    readonly branch?: {
      readonly name: string;
      readonly phone: string | null;
      readonly city: string | null;
      readonly state: string | null;
    } | null;
  };
}

export const CentreHero = ({ organization }: CentreHeroProps) => {
  const workspaceUrl = buildWorkspaceUrl(organization.slug);
  const hostname = formatWorkspaceHostname(organization.slug);

  const locationParts = [
    organization.branch?.city,
    organization.branch?.state,
  ].filter(Boolean);
  const locationLabel = locationParts.join(", ");

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity & Subdomain details */}
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            {organization.imageUrl ? (
              <Image
                alt={organization.name}
                className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-border/60 sm:size-20"
                height={80}
                src={organization.imageUrl}
                unoptimized
                width={80}
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-2xl text-primary ring-1 ring-primary/20 sm:size-20 sm:text-3xl">
                {organization.name[0]?.toUpperCase() ?? "C"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-foreground text-xl tracking-tight sm:text-2xl">
                  {organization.name}
                </h2>
                <Badge color="green" size="compact" variant="solid">
                  Active
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-muted-foreground text-sm">
                <div className="inline-flex max-w-xs items-center">
                  <InputCopy
                    align="right"
                    aria-label="Workspace URL"
                    className="max-w-[240px]"
                    size="compact"
                    value={workspaceUrl}
                    variant="icon"
                  />
                </div>

                {locationLabel ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPinIcon className="size-3" />
                    {locationLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:flex-nowrap lg:pt-0">
            <Button asChild className="gap-2 font-medium" size="default">
              <a
                aria-label={`Open ${organization.name} workspace at ${hostname}`}
                href={workspaceUrl}
              >
                Launch Workspace
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>

            <Button asChild size="default" variant="secondary">
              <Link href={`/centres/${organization.id}/settings`}>
                <SettingsIcon className="size-4" />
                Settings
              </Link>
            </Button>

            <Button asChild size="default" variant="secondary">
              <Link href={`/centres/${organization.id}/subscription`}>
                <CreditCardIcon className="size-4" />
                Subscription
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
