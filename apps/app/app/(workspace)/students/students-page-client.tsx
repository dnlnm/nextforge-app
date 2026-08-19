"use client";

import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Drawer, DrawerPanel, DrawerPopup, DrawerTitle } from "@repo/design-system/components/ui/drawer";
import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { useMediaQuery } from "@repo/design-system/hooks/use-media-query";
import { EASE, INSTANT } from "@repo/design-system/lib/motion";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import {
  LandmarkIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { getStudentDetail } from "./actions";
import type { Student } from "./columns";
import { useKpiVisibility } from "./kpi-visibility";
import { type StudentDetail, StudentDetailContent } from "./student-detail-content";
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
  const formatMoney = (amountSen: number) => formatMoneyShared(amountSen, { currency });
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(
    defaultStudentDetail
  );
  const isDesktop = useMediaQuery("xl");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showKpis } = useKpiVisibility();
  const reduced = useReducedMotion();

  // When the user selects a row that isn't the default, hydrate its detail
  // (primary guardian + invoices) on demand instead of shipping every student.
  const onSelectStudent = async (studentId: string) => {
    if (selectedStudent?.id === studentId) {
      if (!isDesktop) {
        setDrawerOpen(true);
      }
      return;
    }

    const detail = await getStudentDetail(studentId);
    setSelectedStudent(detail as StudentDetail | null);
    if (!isDesktop) {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_380px]">
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
              <Stat>
                <StatPanel>
                  <StatLabel>Total Students</StatLabel>
                  <StatIndicator color="info" variant="icon">
                    <UsersRoundIcon />
                  </StatIndicator>
                  <StatValue>{totalStudents.toLocaleString()}</StatValue>
                </StatPanel>
                <StatFooter>
                  <StatDescription>All registered students</StatDescription>
                </StatFooter>
              </Stat>

              <Stat>
                <StatPanel>
                  <StatLabel>Active Students</StatLabel>
                  <StatIndicator color="success" variant="icon">
                    <UserCheckIcon />
                  </StatIndicator>
                  <StatValue>{activeStudents.toLocaleString()}</StatValue>
                </StatPanel>
                <StatFooter>
                  <StatDescription>
                    {totalStudents > 0
                      ? `${Math.round((activeStudents / totalStudents) * 100)}% of total`
                      : "0% of total"}
                  </StatDescription>
                </StatFooter>
              </Stat>

              <Stat>
                <StatPanel>
                  <StatLabel>New Students ({monthLabel})</StatLabel>
                  <StatIndicator color="info" variant="icon">
                    <UserPlusIcon />
                  </StatIndicator>
                  <StatValue>{newStudentsThisMonth.toLocaleString()}</StatValue>
                </StatPanel>
                <StatFooter>
                  <StatDescription>Added this month</StatDescription>
                </StatFooter>
              </Stat>

              <Stat>
                <StatPanel>
                  <StatLabel>Outstanding Fees</StatLabel>
                  <StatIndicator color="warning" variant="icon">
                    <LandmarkIcon />
                  </StatIndicator>
                  <StatValue>{formatMoney(outstandingSen)}</StatValue>
                </StatPanel>
                <StatFooter>
                  <StatDescription>
                    {studentsWithOutstanding} students
                  </StatDescription>
                </StatFooter>
              </Stat>
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

      <aside className="hidden xl:sticky xl:top-4 xl:block xl:self-start">
        <Card>
          {selectedStudent ? (
            <StudentDetailContent currency={currency} student={selectedStudent} />
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No students to display.
            </CardContent>
          )}
        </Card>
      </aside>

      <Drawer
        onOpenChange={setDrawerOpen}
        open={drawerOpen && !!selectedStudent && !isDesktop}
        position="right"
      >
        <DrawerPopup>
          {selectedStudent && (
            <>
              <DrawerTitle className="sr-only">{selectedStudent.fullName}</DrawerTitle>
              <DrawerPanel className="p-0">
                <StudentDetailContent currency={currency} student={selectedStudent} />
              </DrawerPanel>
            </>
          )}
        </DrawerPopup>
      </Drawer>
    </div>
  );
}
