"use client";

import {
  VanillaDrawer,
  VanillaDrawerDescription,
  VanillaDrawerHeader,
  VanillaDrawerPanel,
  VanillaDrawerPopup,
  VanillaDrawerTitle,
} from "@repo/design-system/components/ui/drawer-vanilla";
import { StatLabel, StatValue } from "@repo/design-system/components/ui/stat";
import { KpiStatIcon } from "../components/kpi-stat-icon";
import { FluidPanel } from "@repo/design-system/components/fluid-panel";
import { easeOutStrong } from "@repo/design-system/lib/springs";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import {
  LandmarkIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useKpiVisibility } from "../components/kpi-visibility";
import { getStudentDetail } from "./actions";
import type { Student } from "./columns";
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
  currency: string;
  defaultStudentDetail: StudentDetail | null;
  genderOptions: FilterOption[];
  initialData: Student[];
  initialTotalCount: number;
  levelOptions: FilterOption[];
  monthLabel: string;
  newStudentsThisMonth: number;
  outstandingSen: number;
  studentsWithOutstanding: number;
  totalStudents: number;
};

export function StudentsPageClient({
  activeStudents,
  currency,
  defaultStudentDetail,
  genderOptions,
  initialData,
  initialTotalCount,
  levelOptions,
  monthLabel,
  newStudentsThisMonth,
  outstandingSen,
  studentsWithOutstanding,
  totalStudents,
}: StudentsPageClientProps) {
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(
    defaultStudentDetail
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showKpis } = useKpiVisibility();
  const reduced = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
                <FluidPanel
                  className="relative flex h-full flex-col"
                  key={stat.label}
                  label={stat.detail}
                  stageClassName="flex-col items-start justify-center gap-3 p-4 sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <KpiStatIcon color={stat.color} icon={stat.icon} />
                    <StatLabel>{stat.label}</StatLabel>
                  </div>
                  <StatValue>{stat.value}</StatValue>
                  <Link
                    aria-label={stat.label}
                    className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={stat.href}
                  />
                </FluidPanel>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        <StudentsTable
          genderOptions={genderOptions}
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          levelOptions={levelOptions}
          onRowClick={(studentId) => onSelectStudent(studentId)}
        />
      </section>

      <VanillaDrawer
        onOpenChange={setDrawerOpen}
        open={drawerOpen && !!selectedStudent}
      >
        <VanillaDrawerPopup>
          {selectedStudent && (
            <>
              <VanillaDrawerHeader>
                <VanillaDrawerTitle>{selectedStudent.fullName}</VanillaDrawerTitle>
                <VanillaDrawerDescription>
                  {selectedStudent.code} ·{" "}
                  {selectedStudent.level?.name ?? "No level"} ·{" "}
                  {selectedStudent.status === "ACTIVE" ? "Active" : "Archived"}
                </VanillaDrawerDescription>
              </VanillaDrawerHeader>
              <VanillaDrawerPanel className="p-0">
                <StudentDetailContent
                  currency={currency}
                  student={selectedStudent}
                />
              </VanillaDrawerPanel>
            </>
          )}
        </VanillaDrawerPopup>
      </VanillaDrawer>
    </div>
  );
}
