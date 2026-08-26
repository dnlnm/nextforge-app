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
import {
  UserRoundCheckIcon,
  UserRoundIcon,
  UserRoundXIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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

  const selectedTeacher = allTeachers.find(
    (teacher) => teacher.id === selectedTeacherId
  );

  const stats = [
    {
      color: "info" as const,
      detail: `${activeTeachers} active profiles`,
      icon: UsersRoundIcon,
      label: "Total Teachers",
      value: totalTeachers.toLocaleString(),
    },
    {
      color: "success" as const,
      detail: `${totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0}% of total`,
      icon: UserRoundCheckIcon,
      label: "Active Teachers",
      value: activeTeachers.toLocaleString(),
    },
    {
      color: "default" as const,
      detail: `${activeTeachers > 0 ? Math.round((assignedTeachers / activeTeachers) * 100) : 0}% with classes`,
      icon: UserRoundIcon,
      label: "Assigned Teachers",
      value: assignedTeachers.toLocaleString(),
    },
    {
      color: "warning" as const,
      detail: `${unassignedTeachers} active unassigned`,
      icon: UserRoundXIcon,
      label: "Inactive Teachers",
      value: archivedTeachers.toLocaleString(),
    },
  ];

  const onSelectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setDrawerOpen(true);
  };

  return (
    <div className="grid gap-5">
      <section className="grid content-start gap-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ color, detail, icon: Icon, label, value }) => (
            <Stat key={label}>
              <StatPanel>
                <StatLabel>{label}</StatLabel>
                <StatIndicator color={color} variant="icon">
                  <Icon />
                </StatIndicator>
                <StatValue>{value}</StatValue>
              </StatPanel>
              <StatFooter>
                <StatDescription>{detail}</StatDescription>
              </StatFooter>
            </Stat>
          ))}
        </section>

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
