"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  ChevronRightIcon,
  MoreHorizontalIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
  UserRoundXIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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

interface FilterOption {
  label: string;
  value: string;
}

interface TeachersPageClientProps {
  activeTeachers: number;
  allTeachers: Teacher[];
  archivedTeachers: number;
  assignedTeachers: number;
  branchOptions: FilterOption[];
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
  subjectOptions: FilterOption[];
  totalTeachers: number;
  unassignedTeachers: number;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export function TeachersPageClient({
  activeTeachers,
  allTeachers,
  archivedTeachers,
  assignedTeachers,
  branchOptions,
  initialData,
  initialTotalCount,
  subjectOptions,
  totalTeachers,
  unassignedTeachers,
}: TeachersPageClientProps) {
  const searchParams = useSearchParams();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    () => searchParams.get("teacherId") ?? allTeachers[0]?.id ?? null
  );

  const selectedTeacher = allTeachers.find(
    (teacher) => teacher.id === selectedTeacherId
  );
  const selectedSubjects = selectedTeacher
    ? Array.from(
        new Set(
          selectedTeacher.classes.map(
            (learningClass) => learningClass.subject.name
          )
        )
      )
    : [];
  const selectedStudentsCount = selectedTeacher
    ? selectedTeacher.classes.reduce(
        (total, learningClass) => total + learningClass.enrollments.length,
        0
      )
    : 0;

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

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_380px]">
      <section className="grid content-start gap-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ color, detail, icon: Icon, label, value }) => (
            <Stat className="h-full" key={label}>
              <StatLabel>{label}</StatLabel>
              <StatIndicator color={color} variant="icon">
                <Icon />
              </StatIndicator>
              <StatValue>{value}</StatValue>
              <StatDescription>{detail}</StatDescription>
            </Stat>
          ))}
        </section>

        <TeachersTable
          branchOptions={branchOptions}
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          onRowClick={(teacherId) => setSelectedTeacherId(teacherId)}
          subjectOptions={subjectOptions}
        />
      </section>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <Card>
          {selectedTeacher ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                    <UserRoundIcon className="size-10" />
                  </div>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {selectedTeacher.fullName}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    <span>{selectedTeacher.code}</span>
                    <span>+</span>
                    <span>{selectedTeacher.branch?.name ?? "No branch"}</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <Link href={`https://wa.me/${selectedTeacher.phone ?? ""}`}>
                      WhatsApp
                    </Link>
                  </Button>
                  <Button variant="outline">More</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-0">
                <section className="grid gap-3 border-b p-4">
                  <h2 className="font-semibold text-sm">Teacher Information</h2>
                  {[
                    ["Joined", formatDate(selectedTeacher.createdAt)],
                    ["Phone", selectedTeacher.phone ?? "-"],
                    ["Email", selectedTeacher.email ?? "-"],
                    ["Branch", selectedTeacher.branch?.name ?? "-"],
                    ["Status", "Active"],
                  ].map(([label, value]) => (
                    <div
                      className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                      key={label}
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </section>
                <section className="grid gap-3 border-b p-4">
                  <h2 className="font-semibold text-sm">Teaching Load</h2>
                  {[
                    ["Classes", selectedTeacher.classes.length],
                    ["Subjects", selectedSubjects.join(", ") || "-"],
                    ["Students", selectedStudentsCount],
                  ].map(([label, value]) => (
                    <div
                      className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                      key={label}
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <Button asChild className="mt-1 w-full" variant="outline">
                    <Link href={`/teachers?teacherId=${selectedTeacher.id}`}>
                      View Full Profile
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                </section>
                <section className="grid gap-3 p-4">
                  <h2 className="font-semibold text-sm">Notes</h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedTeacher.notes ?? "No notes recorded."}
                  </p>
                </section>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No teachers to display.
            </CardContent>
          )}
        </Card>
      </aside>
    </div>
  );
}
