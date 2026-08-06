"use client";

import { cn } from "@repo/design-system/lib/utils";
import { BuildingIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import type { WorkspaceCounts } from "./workspaces-dropdown";
import { WorkspacesDropdown } from "./workspaces-dropdown";

export const MainNav = ({ counts }: { readonly counts: WorkspaceCounts }) => {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6">
      <Link className="flex items-center space-x-2" href="/centres">
        <Brand />
      </Link>

      <nav className="hidden items-center space-x-6 font-medium text-sm md:flex">
        <WorkspacesDropdown
          adminCount={counts.admin}
          teacherCount={counts.teacher}
        />
        <Link
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/centres")
              ? "text-foreground"
              : "text-foreground/60"
          )}
          href="/centres"
        >
          <BuildingIcon className="mr-2 inline-block size-4" />
          Centres
        </Link>
      </nav>
    </div>
  );
};
