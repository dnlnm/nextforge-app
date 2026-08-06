"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  BriefcaseIcon,
  ChevronDownIcon,
  GraduationCapIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface WorkspacesDropdownProperties {
  readonly adminCount: number;
  readonly teacherCount: number;
}

export interface WorkspaceCounts {
  readonly admin: number;
  readonly teacher: number;
}

export const WorkspacesDropdown = ({
  adminCount,
  teacherCount,
}: WorkspacesDropdownProperties) => {
  const pathname = usePathname();

  const isActive =
    pathname?.startsWith("/workspaces/admin") ||
    pathname?.startsWith("/workspaces/teacher");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={
            isActive
              ? "text-foreground transition-colors hover:bg-transparent"
              : "text-foreground/60 transition-colors hover:text-foreground/80"
          }
          variant="ghost"
        >
          My Workspaces
          <ChevronDownIcon className="ml-1 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/workspaces/admin">
            <BriefcaseIcon className="size-4" />
            Admin Centres ({adminCount})
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/workspaces/teacher">
            <GraduationCapIcon className="size-4" />
            Teacher Centres ({teacherCount})
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
