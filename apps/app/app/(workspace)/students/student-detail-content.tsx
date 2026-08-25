"use client";

import { formatShortDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import { privateFileUrl } from "@repo/storage/client";
import Link from "next/link";
import { useState } from "react";

import { ArchiveStudentDialog } from "../components/archive-student-dialog";
import { DeleteStudentDialog } from "../components/delete-student-dialog";
import { StudentAvatar } from "../components/student-avatar";
import { StudentStatusBadge } from "../components/student-status-badge";

export type StudentDetail = {
  addressLine1: string | null;
  code: string;
  dateOfBirth: Date | null;
  email: string | null;
  enrolledAt: Date;
  fullName: string;
  gender: string | null;
  icNumber: string | null;
  id: string;
  phone: string | null;
  photoKey: string | null;
  schoolName: string | null;
  status: string;
  level: {
    name: string;
  } | null;
  guardians: Array<{
    relationship: string | null;
    guardian: {
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      email: string | null;
      fullName: string | null;
      icNumber: string | null;
      phone: string | null;
      state: string | null;
    };
  }>;
  invoices?: Array<{
    totalSen: number;
    amountPaidSen: number;
  }>;
};

type StudentDetailContentProps = {
  currency: string;
  student: StudentDetail;
};

const formatDate = (date: Date) => formatShortDate(date);

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Legal Guardian",
  OTHER: "Other",
};

const relationshipLabel = (value: string | null | undefined) =>
  value ? (RELATIONSHIP_LABELS[value] ?? value) : "-";

export function StudentDetailContent({
  currency,
  student,
}: StudentDetailContentProps) {
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  const guardian = student.guardians[0]?.guardian;
  const invoices = student.invoices ?? [];
  const outstandingSen = invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
    0
  );
  const billedSen = invoices.reduce(
    (total, invoice) => total + invoice.totalSen,
    0
  );
  const paidSen = invoices.reduce(
    (total, invoice) => total + invoice.amountPaidSen,
    0
  );
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <CardHeader className="border-b">
        <StudentAvatar
          className="size-20"
          gender={student.gender}
          name={student.fullName}
          photoUrl={privateFileUrl(student.photoKey)}
        />
        <div className="min-w-0">
          <CardTitle className="text-xl">
            <span className="text-balance">{student.fullName}</span>
          </CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{student.code}</span>
            <StudentStatusBadge status={student.status} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button render={<Link href={`/students/${student.id}`} />}>
            More
          </Button>
          <Button
            render={<Link href={`https://wa.me/${guardian?.phone ?? ""}`} />}
            variant="outline"
          >
            WhatsApp
          </Button>
          <Button
            onClick={() => setIsArchiveOpen(true)}
            variant="destructive-outline"
          >
            Archive
          </Button>
          <Button onClick={() => setIsDeleteOpen(true)} variant="destructive">
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-0">
        <section className="grid gap-3 border-b p-4">
          <h2 className="font-semibold text-sm">Student Information</h2>
          {[
            ["Registration Date", formatDate(student.enrolledAt)],
            [
              "Date of Birth",
              student.dateOfBirth ? formatDate(student.dateOfBirth) : "-",
            ],
            [
              "Gender",
              student.gender
                ? student.gender.charAt(0) +
                  student.gender.slice(1).toLowerCase()
                : "-",
            ],
            ["Level", student.level?.name ?? "-"],
            ["IC Number", student.icNumber ?? "-"],
            ["School", student.schoolName ?? "-"],
            ["Phone", student.phone ?? "-"],
            ["Email", student.email ?? "-"],
            ["Address", student.addressLine1 ?? "-"],
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
            ["Name", guardian?.fullName ?? "-"],
            ["Relationship", relationshipLabel(student.guardians[0]?.relationship)],
            ["IC Number", guardian?.icNumber ?? "-"],
            ["Phone", guardian?.phone ?? "-"],
            ["Email", guardian?.email ?? "-"],
            [
              "Address",
              [
                guardian?.addressLine1,
                guardian?.addressLine2,
                guardian?.city,
                guardian?.state,
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
            ["Total Billed", formatMoney(billedSen)],
            ["Total Paid", formatMoney(paidSen)],
            ["Outstanding", formatMoney(outstandingSen)],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-3 text-sm" key={label}>
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </section>
      </CardContent>
      <ArchiveStudentDialog
        onOpenChange={setIsArchiveOpen}
        open={isArchiveOpen}
        studentId={student.id}
      />
      <DeleteStudentDialog
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
        studentId={student.id}
      />
    </>
  );
}
