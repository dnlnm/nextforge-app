"use client";

import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import type { ReactNode } from "react";

interface DataTableMobileCardsProps<T> {
  emptyLabel: string;
  getRowKey?: (item: T) => string;
  isLoading: boolean;
  items: T[];
  renderCard: (item: T) => ReactNode;
  skeletonCount?: number;
}

const SKELETON_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

export function DataTableMobileCards<T>({
  emptyLabel,
  getRowKey,
  isLoading,
  items,
  renderCard,
  skeletonCount = 4,
}: DataTableMobileCardsProps<T>) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:hidden">
        {SKELETON_KEYS.slice(0, skeletonCount).map((key) => (
          <CardShell key={key} panelClassName="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CardShell>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden">
        <CardShell panelClassName="p-6">
          <p className="text-center text-muted-foreground text-sm">
            {emptyLabel}
          </p>
        </CardShell>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {items.map((item, index) => (
        <div key={getRowKey?.(item) ?? index}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
