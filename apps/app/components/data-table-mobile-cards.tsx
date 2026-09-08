"use client";

import { Elevated } from "@repo/design-system/lib/elevated";
import { useShape } from "@repo/design-system/lib/shape-context";
import { cn } from "@repo/design-system/lib/utils";
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

/** Elevated surface frame replacing CardShell for mobile cards. */
function MobileCardFrame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const shape = useShape();
  return (
    <Elevated
      className={cn(shape.container, className)}
      data-slot="mobile-card"
      offset={1}
    >
      {children}
    </Elevated>
  );
}

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
          <MobileCardFrame key={key} className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse bg-muted size-10 rounded-full" />
              <div className="grid flex-1 gap-2">
                <div className="animate-pulse bg-muted h-4 w-2/3" />
                <div className="animate-pulse bg-muted h-3 w-1/3" />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="animate-pulse bg-muted h-3 w-1/2" />
              <div className="animate-pulse bg-muted h-3 w-1/3" />
            </div>
          </MobileCardFrame>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden">
        <MobileCardFrame className="p-6">
          <p className="text-center text-muted-foreground text-sm">
            {emptyLabel}
          </p>
        </MobileCardFrame>
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
