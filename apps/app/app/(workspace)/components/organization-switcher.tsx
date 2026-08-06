"use client";

import { createClient } from "@repo/auth/client";
import type { MembershipRole } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { ChevronDownIcon, PlusCircleIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOrganizations,
  switchOrganization,
} from "../onboarding/organization/actions";

const getRoleBadgeVariant = (
  role: MembershipRole
): "default" | "secondary" | "outline" => {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    case "TEACHER":
      return "outline";
  }
};

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
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              {activeMembership?.role && (
                <Badge
                  className="h-4 px-1.5 text-[10px]"
                  variant={getRoleBadgeVariant(activeMembership.role)}
                >
                  {activeMembership.role}
                </Badge>
              )}
              {activeMembership?.organization.slug ? (
                <span className="truncate">
                  {activeMembership.organization.slug}
                </span>
              ) : (
                !activeMembership && "No active organization"
              )}
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
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm">
                  {membership.organization.name}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Badge
                    className="h-4 px-1.5 text-[10px]"
                    variant={getRoleBadgeVariant(membership.role)}
                  >
                    {membership.role}
                  </Badge>
                  {membership.organization.slug && (
                    <span className="truncate">
                      {membership.organization.slug}
                    </span>
                  )}
                </span>
              </span>
              {isActive ? (
                <span className="shrink-0 text-muted-foreground text-xs">
                  Active
                </span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2" href="/center-setup">
            <PlusCircleIcon className="size-4" />
            New Center
          </Link>
        </DropdownMenuItem>
        {activeMembership?.role !== "TEACHER" && (
          <DropdownMenuItem asChild>
            <Link className="flex items-center gap-2" href="/settings">
              <Settings2Icon className="size-4" />
              Manage
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
