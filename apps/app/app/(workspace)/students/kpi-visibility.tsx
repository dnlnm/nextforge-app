"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { createContext, useContext, useState } from "react";

interface KpiVisibility {
  showKpis: boolean;
  toggleKpis: () => void;
}

const KpiVisibilityContext = createContext<KpiVisibility | null>(null);

export function KpiVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showKpis, setShowKpis] = useState(true);
  const toggleKpis = () => setShowKpis((value) => !value);

  return (
    <KpiVisibilityContext.Provider value={{ showKpis, toggleKpis }}>
      {children}
    </KpiVisibilityContext.Provider>
  );
}

export function useKpiVisibility() {
  const context = useContext(KpiVisibilityContext);
  if (!context) {
    throw new Error(
      "useKpiVisibility must be used within a KpiVisibilityProvider"
    );
  }
  return context;
}

export function KpiToggleButton() {
  const { showKpis, toggleKpis } = useKpiVisibility();

  return (
    <Button
      aria-expanded={showKpis}
      aria-label={showKpis ? "Hide summary" : "Show summary"}
      className="shrink-0 md:hidden"
      onClick={toggleKpis}
      size="icon"
      variant="outline"
    >
      <ChevronDownIcon
        className={cn("size-4 transition-transform", !showKpis && "rotate-180")}
      />
    </Button>
  );
}
