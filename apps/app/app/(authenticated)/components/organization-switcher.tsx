"use client";

import { createClient } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { ChevronDownIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOrganizations,
  switchOrganization,
} from "../onboarding/organization/actions";

export const OrganizationSwitcher = () => {
  const [memberships, setMemberships] = useState<
    Awaited<ReturnType<typeof getOrganizations>>
  >([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const load = async () => {
      const [organizations, user] = await Promise.all([
        getOrganizations(),
        createClient().auth.getUser(),
      ]);
      setMemberships(organizations);
      setActiveOrganizationId(
        (user.data.user?.user_metadata?.activeOrganizationId as
          | string
          | undefined) ?? null
      );
    };
    load().catch(() => undefined);
  }, []);

  const activeMembership = memberships.find(
    (membership) => membership.organization.id === activeOrganizationId
  );

  if (!memberships.length) {
    return (
      <div className="flex h-9 items-center rounded-md border bg-background px-3 text-muted-foreground text-sm">
        No organization
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto w-full justify-between rounded-md border bg-background px-3 py-2 text-left shadow-none hover:bg-accent"
          variant="ghost"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-sm">
              {activeMembership?.organization.name ?? "Select organization"}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              {activeMembership?.organization.slug ?? "No active organization"}
            </span>
          </span>
          <ChevronDownIcon className="ml-3 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => {
          const isActive = membership.organization.id === activeOrganizationId;

          return (
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between gap-3"
              key={membership.id}
              onSelect={() => {
                if (!isActive) {
                  switchOrganization(membership.organization.id)
                    .then(() => {
                      setActiveOrganizationId(membership.organization.id);
                      window.location.reload();
                    })
                    .catch(() => undefined);
                }
              }}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-sm">
                  {membership.organization.name}
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {membership.organization.slug ?? membership.role}
                </span>
              </span>
              {isActive ? (
                <span className="text-muted-foreground text-xs">Active</span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2" href="/settings">
            <Settings2Icon className="size-4" />
            Manage
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
