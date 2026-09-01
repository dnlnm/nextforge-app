"use client";

import { formatShortDate } from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { privateFileUrl } from "@repo/storage/client";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { StudentAvatar } from "../components/student-avatar";

export type TeacherDetail = {
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
  gender: string | null;
  id: string;
  notes: string | null;
  phone: string | null;
  photoKey: string | null;
};

type TeacherDetailContentProps = {
  teacher: TeacherDetail;
};

const formatDate = (date: Date) => formatShortDate(date);

export function TeacherDetailContent({ teacher }: TeacherDetailContentProps) {
  const subjects = Array.from(
    new Set(teacher.classes.map((learningClass) => learningClass.subject.name))
  );
  const studentsCount = teacher.classes.reduce(
    (total, learningClass) => total + learningClass.enrollments.length,
    0
  );

  return (
    <>
      <CardHeader className="border-b">
        <StudentAvatar
          className="size-20"
          gender={teacher.gender}
          name={teacher.fullName}
          photoUrl={privateFileUrl(teacher.photoKey)}
        />
        <div className="min-w-0">
          <CardTitle className="text-xl">
            <span className="text-balance">{teacher.fullName}</span>
          </CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{teacher.code}</span>
            <span>+</span>
            <span>{teacher.branch?.name ?? "No branch"}</span>
            <Badge variant="outline">Active</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button render={<Link href={`/teachers/${teacher.id}`} />}>
            More
          </Button>
          <Button
            render={<Link href={`https://wa.me/${teacher.phone ?? ""}`} />}
            variant="outline"
          >
            WhatsApp
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-0">
        <section className="grid gap-3 border-b p-4">
          <h2 className="font-semibold text-sm">Teacher Information</h2>
          {[
            ["Joined", formatDate(teacher.createdAt)],
            ["Phone", teacher.phone ?? "-"],
            ["Email", teacher.email ?? "-"],
            ["Branch", teacher.branch?.name ?? "-"],
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
            ["Classes", teacher.classes.length],
            ["Subjects", subjects.join(", ") || "-"],
            ["Students", studentsCount],
          ].map(([label, value]) => (
            <div
              className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
              key={label}
            >
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <Button
            className="mt-1 w-full"
            render={<Link href={`/teachers/${teacher.id}`} />}
            variant="outline"
          >
            View Full Profile
            <ChevronRightIcon className="size-4" />
          </Button>
        </section>
        <section className="grid gap-3 p-4">
          <h2 className="font-semibold text-sm">Notes</h2>
          <p className="text-muted-foreground text-sm">
            {teacher.notes ?? "No notes recorded."}
          </p>
        </section>
      </CardContent>
    </>
  );
}
