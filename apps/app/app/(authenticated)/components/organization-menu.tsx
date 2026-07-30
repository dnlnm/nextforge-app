"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useOrganization } from "./organization-context";

const whitespaceRegex = /\s+/;

const getInitials = (value?: string) => {
  const parts = value?.trim().split(whitespaceRegex).filter(Boolean) ?? [];

  return (
    parts
      .slice(0, 2)
      .map((part) => part.at(0))
      .join("")
      .toUpperCase() || "T"
  );
};

export const OrganizationMenu = () => {
  const organization = useOrganization();
  const centreName = organization?.name ?? "TLAS.MY";
  const logoSrc = organization?.imageUrl
    ? `/api/organization-logo?version=${encodeURIComponent(organization.imageUrl)}`
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto gap-3 rounded-lg px-3 py-2 shadow-none"
          variant="outline"
        >
          <Avatar className="size-8 rounded-lg border bg-sidebar">
            {logoSrc ? <AvatarImage alt={centreName} src={logoSrc} /> : null}
            <AvatarFallback className="rounded-lg bg-primary font-semibold text-primary-foreground">
              {getInitials(centreName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate font-medium text-sm">
              {centreName}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              Active centre
            </span>
          </span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Centre</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2" href="/billing">
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2" href="/settings">
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
