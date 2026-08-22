"use client";

import { Card } from "@repo/design-system/components/ui/card";
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import {
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { EASE, INSTANT } from "@repo/design-system/lib/motion";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import {
  LandmarkIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { getStudentDetail } from "./actions";
import type { Student } from "./columns";
import { useKpiVisibility } from "./kpi-visibility";
import {
  type StudentDetail,
  StudentDetailContent,
} from "./student-detail-content";
import { StudentsTable } from "./students-table";

type FilterOption = {
  label: string;
  value: string;
};

type StudentsPageClientProps = {
  activeStudents: number;
  classOptions: FilterOption[];
  currency: string;
  defaultStudentDetail: StudentDetail | null;
  genderOptions: FilterOption[];
  initialData: Student[];
  initialTotalCount: number;
  levelOptions: FilterOption[];
  monthLabel: string;
  newStudentsThisMonth: number;
  outstandingSen: number;
  statusOptions: FilterOption[];
  studentsWithOutstanding: number;
  totalStudents: number;
  tutorOptions: FilterOption[];
};

export function StudentsPageClient({
  activeStudents,
  classOptions,
  currency,
  defaultStudentDetail,
  genderOptions,
  initialData,
  initialTotalCount,
  levelOptions,
  monthLabel,
  newStudentsThisMonth,
  outstandingSen,
  statusOptions,
  studentsWithOutstanding,
  totalStudents,
  tutorOptions,
}: StudentsPageClientProps) {
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(
    defaultStudentDetail
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showKpis } = useKpiVisibility();
  const reduced = useReducedMotion();

  // When the user selects a row that isn't the default, hydrate its detail
  // (primary guardian + invoices) on demand instead of shipping every student.
  const onSelectStudent = async (studentId: string) => {
    if (selectedStudent?.id === studentId) {
      setDrawerOpen(true);
      return;
    }

    const detail = await getStudentDetail(studentId);
    setSelectedStudent(detail as StudentDetail | null);
    setDrawerOpen(true);
  };

  return (
    <div className="grid gap-5">
      <section className="grid content-start">
        <AnimatePresence initial={false}>
          {showKpis && (
            <motion.section
              animate={{ opacity: 1, height: "auto", marginBottom: "1.25rem" }}
              className="grid grid-cols-2 gap-3 overflow-hidden xl:grid-cols-4"
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={reduced ? INSTANT : { duration: 0.28, ease: EASE }}
            >
              {[
                {
                  color: "info" as const,
                  detail: "All registered students",
                  href: "/students",
                  icon: UsersRoundIcon,
                  label: "Total Students",
                  value: totalStudents.toLocaleString(),
                },
                {
                  color: "success" as const,
                  detail:
                    totalStudents > 0
                      ? `${Math.round((activeStudents / totalStudents) * 100)}% of total`
                      : "0% of total",
                  href: "/students",
                  icon: UserCheckIcon,
                  label: "Active Students",
                  value: activeStudents.toLocaleString(),
                },
                {
                  color: "info" as const,
                  detail: "Added this month",
                  href: "/students",
                  icon: UserPlusIcon,
                  label: `New Students (${monthLabel})`,
                  value: newStudentsThisMonth.toLocaleString(),
                },
                {
                  color: "warning" as const,
                  detail: `${studentsWithOutstanding} students`,
                  href: "/invoices",
                  icon: LandmarkIcon,
                  label: "Outstanding Fees",
                  value: formatMoney(outstandingSen),
                },
              ].map((stat) => (
                <div
                  className={cn(
                    "relative h-full rounded-xl border border-border/70 p-1"
                  )}
                  key={stat.label}
                >
                  <div className="relative h-full overflow-hidden rounded-lg">
                    <div
                      aria-hidden="true"
                      className="absolute inset-1 z-0 rounded-sm"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent, transparent 2px, var(--border) 2px, var(--border) 4px)",
                        opacity: 0.5,
                      }}
                    />
                    <Card className="relative isolate z-10 h-full rounded-lg border-2 border-border bg-transparent shadow-none before:hidden">
                      <div className="grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-2 p-4 **:data-[slot=stat-value]:col-span-2 **:data-[slot=stat-indicator]:col-start-1 **:data-[slot=stat-label]:col-start-2 **:data-[slot=stat-indicator]:row-start-1 **:data-[slot=stat-label]:row-start-1 **:data-[slot=stat-value]:row-start-2 **:data-[slot=stat-indicator]:self-center **:data-[slot=stat-label]:self-center max-md:p-3">
                        <StatLabel>{stat.label}</StatLabel>
                        <StatIndicator color={stat.color} variant="stacked">
                          <stat.icon />
                        </StatIndicator>
                        <StatValue>{stat.value}</StatValue>
                      </div>
                      <div className="flex flex-col items-start gap-2 px-4 py-3 max-md:px-3 max-md:py-2">
                        <StatDescription className="min-w-0 flex-1">
                          {stat.detail}
                        </StatDescription>
                      </div>
                    </Card>
                  </div>
                  <Link
                    aria-label={stat.label}
                    className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={stat.href}
                  />
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        <StudentsTable
          classOptions={classOptions}
          genderOptions={genderOptions}
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          levelOptions={levelOptions}
          onRowClick={(studentId) => onSelectStudent(studentId)}
          statusOptions={statusOptions}
          tutorOptions={tutorOptions}
        />
      </section>

      <Drawer
        onOpenChange={setDrawerOpen}
        open={drawerOpen && !!selectedStudent}
        position="right"
      >
        <DrawerPopup variant="inset">
          {selectedStudent && (
            <>
              <DrawerHeader>
                <DrawerTitle>{selectedStudent.fullName}</DrawerTitle>
                <DrawerDescription>
                  {selectedStudent.code} ·{" "}
                  {selectedStudent.level?.name ?? "No level"} ·{" "}
                  {selectedStudent.status === "ACTIVE" ? "Active" : "Archived"}
                </DrawerDescription>
              </DrawerHeader>
              <DrawerPanel className="p-0">
                <StudentDetailContent
                  currency={currency}
                  student={selectedStudent}
                />
              </DrawerPanel>
            </>
          )}
        </DrawerPopup>
      </Drawer>
    </div>
  );
}
