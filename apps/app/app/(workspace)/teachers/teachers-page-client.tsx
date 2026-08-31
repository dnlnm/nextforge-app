"use client";

import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { Icon } from "@repo/design-system/components/ui/icon";
import { StatLabel, StatValue } from "@repo/design-system/components/ui/stat";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { easeOutStrong } from "@repo/design-system/lib/springs";
import {
  UserRoundCheckIcon,
  UserRoundIcon,
  UserRoundXIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useKpiVisibility } from "../components/kpi-visibility";
import {
  type TeacherDetail,
  TeacherDetailContent,
} from "./teacher-detail-content";
import { TeachersTable } from "./teachers-table";

interface Teacher {
  branch: {
    name: string;
  } | null;
  classes: Array<{
    subject: {
      name: string;
    };
    enrollments: Array<{ id: string }>;
  }>;
  code: string;
  createdAt: Date;
  email: string | null;
  fullName: string;
  id: string;
  notes: string | null;
  phone: string | null;
}

interface TeachersPageClientProps {
  activeTeachers: number;
  allTeachers: Teacher[];
  archivedTeachers: number;
  assignedTeachers: number;
  initialData: Array<{
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    branchName: string | null;
    code: string;
    subjects: string[];
    classCount: number;
    status: string;
  }>;
  initialTotalCount: number;
  totalTeachers: number;
  unassignedTeachers: number;
}

export function TeachersPageClient({
  activeTeachers,
  allTeachers,
  archivedTeachers,
  assignedTeachers,
  initialData,
  initialTotalCount,
  totalTeachers,
  unassignedTeachers,
}: TeachersPageClientProps) {
  const searchParams = useSearchParams();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    () => searchParams.get("teacherId") ?? allTeachers[0]?.id ?? null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showKpis } = useKpiVisibility();
  const reduced = useReducedMotion();

  const selectedTeacher = allTeachers.find(
    (teacher) => teacher.id === selectedTeacherId
  );

  const onSelectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
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
              transition={reduced ? { duration: 0 } : { duration: 0.28, ease: easeOutStrong }}
            >
              {[
                {
                  color: "info" as const,
                  detail: `${activeTeachers} active profiles`,
                  href: "/teachers",
                  icon: UsersRoundIcon,
                  label: "Total Teachers",
                  value: totalTeachers.toLocaleString(),
                },
                {
                  color: "success" as const,
                  detail:
                    totalTeachers > 0
                      ? `${Math.round((activeTeachers / totalTeachers) * 100)}% of total`
                      : "0% of total",
                  href: "/teachers",
                  icon: UserRoundCheckIcon,
                  label: "Active Teachers",
                  value: activeTeachers.toLocaleString(),
                },
                {
                  color: "default" as const,
                  detail:
                    activeTeachers > 0
                      ? `${Math.round((assignedTeachers / activeTeachers) * 100)}% with classes`
                      : "0% with classes",
                  href: "/teachers",
                  icon: UserRoundIcon,
                  label: "Assigned Teachers",
                  value: assignedTeachers.toLocaleString(),
                },
                {
                  color: "warning" as const,
                  detail: `${unassignedTeachers} active unassigned`,
                  href: "/teachers",
                  icon: UserRoundXIcon,
                  label: "Inactive Teachers",
                  value: archivedTeachers.toLocaleString(),
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

        <TeachersTable
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          onRowClick={onSelectTeacher}
        />
      </section>

      <Drawer
        onOpenChange={setDrawerOpen}
        open={drawerOpen && !!selectedTeacher}
        position="right"
      >
        <DrawerPopup variant="inset">
          {selectedTeacher ? (
            <>
              <DrawerHeader>
                <DrawerTitle>{selectedTeacher.fullName}</DrawerTitle>
                <DrawerDescription>
                  {selectedTeacher.code} ·{" "}
                  {selectedTeacher.branch?.name ?? "No branch"} · Active
                </DrawerDescription>
              </DrawerHeader>
              <DrawerPanel className="p-0">
                <TeacherDetailContent
                  teacher={selectedTeacher as TeacherDetail}
                />
              </DrawerPanel>
            </>
          ) : null}
        </DrawerPopup>
      </Drawer>
    </div>
  );
}
