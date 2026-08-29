"use client";

import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { EASE, INSTANT } from "@repo/design-system/lib/motion";
import {
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
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

  return (
    <div className="grid gap-5">
      <section className="grid content-start">
        <AnimatePresence initial={false}>
          {showKpis && (
            <motion.section
              animate={{ opacity: 1, height: "auto", marginBottom: "1.25rem" }}
              className="grid grid-cols-2 gap-5 overflow-hidden py-1.5 xl:grid-cols-4"
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={reduced ? INSTANT : { duration: 0.28, ease: EASE }}
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
                <Stat
                  className="isolate h-full after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 dark:bg-background"
                  key={stat.label}
                >
                  <StatPanel className="dark:bg-background">
                    <StatLabel>{stat.label}</StatLabel>
                    <StatIndicator color={stat.color} variant="stacked">
                      <stat.icon />
                    </StatIndicator>
                    <StatValue>{stat.value}</StatValue>
                  </StatPanel>
                  <StatFooter>
                    <StatDescription>{stat.detail}</StatDescription>
                  </StatFooter>
                  <Link
                    aria-label={stat.label}
                    className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={stat.href}
                  />
                </Stat>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        <ClassesTable classes={classes} />
      </section>
    </div>
  );
}
