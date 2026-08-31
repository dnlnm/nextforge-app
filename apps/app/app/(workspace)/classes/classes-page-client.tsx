"use client";

import { Icon } from "@repo/design-system/components/ui/icon";
import { StatLabel, StatValue } from "@repo/design-system/components/ui/stat";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { easeOutStrong } from "@repo/design-system/lib/springs";
import {
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useKpiVisibility } from "../components/kpi-visibility";
import { ClassesTable, type ClassTableItem } from "./components/classes-table";

interface ClassesPageClientProps {
  activeClasses: number;
  averageClassSize: number;
  classes: ClassTableItem[];
  totalClasses: number;
  totalEnrollments: number;
}

export function ClassesPageClient({
  activeClasses,
  averageClassSize,
  classes,
  totalClasses,
  totalEnrollments,
}: ClassesPageClientProps) {
  const { showKpis } = useKpiVisibility();
  const reduced = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="grid gap-5">
      <section className="grid content-start">
        <AnimatePresence initial={false}>
          {showKpis && (
            <motion.section
              animate={{ opacity: 1, height: "auto", marginBottom: "1.25rem" }}
              className="grid grid-cols-2 gap-5 overflow-hidden py-1.5 xl:grid-cols-4"
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              initial={
                hasMounted ? { opacity: 0, height: 0, marginBottom: 0 } : false
              }
              transition={
                hasMounted
                  ? reduced
                    ? { duration: 0 }
                    : { duration: 0.28, ease: easeOutStrong }
                  : undefined
              }
            >
              {[
                {
                  color: "info" as const,
                  detail: "All registered classes",
                  href: "/classes",
                  icon: BookOpenIcon,
                  label: "Total Classes",
                  value: totalClasses.toLocaleString(),
                },
                {
                  color: "success" as const,
                  detail:
                    totalClasses > 0
                      ? `${Math.round((activeClasses / totalClasses) * 100)}% of total`
                      : "0% of total",
                  href: "/classes",
                  icon: CheckCircle2Icon,
                  label: "Active Classes",
                  value: activeClasses.toLocaleString(),
                },
                {
                  color: "info" as const,
                  detail: "Active enrollments",
                  href: "/classes",
                  icon: UsersRoundIcon,
                  label: "Total Enrolled Students",
                  value: totalEnrollments.toLocaleString(),
                },
                {
                  color: "warning" as const,
                  detail: "Across active classes",
                  href: "/classes",
                  icon: BarChart3Icon,
                  label: "Average Class Size",
                  value: averageClassSize.toFixed(1),
                },
              ].map((stat) => (
                <PreviewCard
                  className="relative flex h-full flex-col"
                  key={stat.label}
                  label={stat.detail}
                  stageClassName="flex-col items-start justify-center gap-3 p-4 sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon color={stat.color} variant="elevated-filled">
                      <stat.icon />
                    </Icon>
                    <StatLabel>{stat.label}</StatLabel>
                  </div>
                  <StatValue>{stat.value}</StatValue>
                  <Link
                    aria-label={stat.label}
                    className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={stat.href}
                  />
                </PreviewCard>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        <ClassesTable classes={classes} />
      </section>
    </div>
  );
}
