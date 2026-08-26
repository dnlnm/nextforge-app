"use client";

import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
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

        <StudentsTable
          genderOptions={genderOptions}
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          levelOptions={levelOptions}
          onRowClick={(studentId) => onSelectStudent(studentId)}
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
