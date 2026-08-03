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
  StatTrend,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  ArrowUp,
  ChevronRightIcon,
  LandmarkIcon,
  MoreHorizontalIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Balancer from "react-wrap-balancer";
import { StudentsTable } from "./students-table";

type Student = {
  id: string;
  fullName: string;
  status: string;
  code: string;
  level: {
    name: string;
  } | null;
  enrolledAt: Date;
  guardians: Array<{
    guardian: {
      fullName: string | null;
      phone: string | null;
      email: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      state: string | null;
    };
  }>;
  invoices?: Array<{
    totalSen: number;
    amountPaidSen: number;
  }>;
};

type FilterOption = {
  label: string;
  value: string;
};

type StudentsPageClientProps = {
  activeStudents: number;
  allStudents: Student[];
  classOptions: FilterOption[];
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

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export function StudentsPageClient({
  activeStudents,
  allStudents,
  classOptions,
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    allStudents[0]?.id ?? null
  );

  const selectedStudent = allStudents.find((s) => s.id === selectedStudentId);
  const selectedGuardian = selectedStudent?.guardians[0]?.guardian;

  const selectedInvoices = selectedStudent?.invoices ?? [];
  const selectedOutstandingSen = selectedStudent
    ? selectedInvoices.reduce(
        (total, invoice) =>
          total + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
        0
      )
    : 0;
  const selectedBilledSen = selectedStudent
    ? selectedInvoices.reduce((total, invoice) => total + invoice.totalSen, 0)
    : 0;
  const selectedPaidSen = selectedStudent
    ? selectedInvoices.reduce(
        (total, invoice) => total + invoice.amountPaidSen,
        0
      )
    : 0;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
      <section className="grid content-start gap-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat>
            <StatLabel>Total Students</StatLabel>
            <StatIndicator color="info" variant="icon">
              <UsersRoundIcon />
            </StatIndicator>
            <StatValue>{totalStudents.toLocaleString()}</StatValue>
            <StatTrend trend="up">
              <ArrowUp />
              +12 from last month
            </StatTrend>
          </Stat>

          <Stat>
            <StatLabel>Active Students</StatLabel>
            <StatIndicator color="success" variant="icon">
              <UserCheckIcon />
            </StatIndicator>
            <StatValue>{activeStudents.toLocaleString()}</StatValue>
            <StatDescription>
              {totalStudents > 0
                ? `${Math.round((activeStudents / totalStudents) * 100)}% of total`
                : "0% of total"}
            </StatDescription>
          </Stat>

          <Stat>
            <StatLabel>New Students ({monthLabel})</StatLabel>
            <StatIndicator color="info" variant="icon">
              <UserPlusIcon />
            </StatIndicator>
            <StatValue>{newStudentsThisMonth.toLocaleString()}</StatValue>
            <StatTrend trend="up">
              <ArrowUp />
              +4 from last month
            </StatTrend>
          </Stat>

          <Stat>
            <StatLabel>Outstanding Fees</StatLabel>
            <StatIndicator color="warning" variant="icon">
              <LandmarkIcon />
            </StatIndicator>
            <StatValue>{formatMoney(outstandingSen)}</StatValue>
            <StatDescription>
              {studentsWithOutstanding} students
            </StatDescription>
          </Stat>
        </section>

        <StudentsTable
          classOptions={classOptions}
          initialData={initialData}
          initialTotalCount={initialTotalCount}
          levelOptions={levelOptions}
          onRowClick={(studentId) => setSelectedStudentId(studentId)}
          statusOptions={statusOptions}
          tutorOptions={tutorOptions}
        />
      </section>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <Card>
          {selectedStudent ? (
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
                <div className="min-w-0">
                  <CardTitle className="text-xl">
                    <Balancer>{selectedStudent.fullName}</Balancer>
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    <span>{selectedStudent.code}</span>
                    <Badge variant="outline">
                      {selectedStudent.status === "ACTIVE"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild variant="outline">
                    <Link
                      href={`https://wa.me/${selectedGuardian?.phone ?? ""}`}
                    >
                      WhatsApp
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/students/${selectedStudent.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline">More</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-0">
                <section className="grid gap-3 border-b p-4">
                  <h2 className="font-semibold text-sm">Student Information</h2>
                  {[
                    [
                      "Registration Date",
                      formatDate(selectedStudent.enrolledAt),
                    ],
                    ["Gender", "-"],
                    ["Level", selectedStudent.level?.name ?? "-"],
                    ["Phone", "-"],
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
                  <h2 className="font-semibold text-sm">Parent / Guardian</h2>
                  {[
                    ["Name", selectedGuardian?.fullName ?? "-"],
                    ["Phone", selectedGuardian?.phone ?? "-"],
                    ["Email", selectedGuardian?.email ?? "-"],
                    [
                      "Address",
                      [
                        selectedGuardian?.addressLine1,
                        selectedGuardian?.addressLine2,
                        selectedGuardian?.city,
                        selectedGuardian?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-",
                    ],
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
                <section className="grid gap-3 p-4">
                  <h2 className="font-semibold text-sm">Fee Summary</h2>
                  {[
                    ["Total Billed", formatMoney(selectedBilledSen)],
                    ["Total Paid", formatMoney(selectedPaidSen)],
                    ["Outstanding", formatMoney(selectedOutstandingSen)],
                  ].map(([label, value]) => (
                    <div
                      className="flex justify-between gap-3 text-sm"
                      key={label}
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <Button asChild className="mt-3 w-full" variant="outline">
                    <Link href={`/students/${selectedStudent.id}`}>
                      View Full Profile
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                </section>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No students to display.
            </CardContent>
          )}
        </Card>
      </aside>
    </div>
  );
}
