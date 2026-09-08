"use client";

import { privateFileUrl } from "@repo/storage/client";
import Link from "next/link";

import { StudentAvatar } from "../components/student-avatar";
import { StudentStatusBadge } from "../components/student-status-badge";
import { type Student, StudentRowActions } from "./columns";

export function StudentCard({
  onRowClick,
  student,
}: {
  onRowClick?: (student: Student) => void;
  student: Student;
}) {
  return (
    <div
      className="cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30 dark:bg-background"
      onClick={() => onRowClick?.(student)}
    >
      <div className="flex items-center gap-3">
        <StudentAvatar
          className="size-10 shrink-0"
          gender={student.gender}
          name={student.fullName}
          photoUrl={privateFileUrl(student.photoKey)}
        />
        <div className="min-w-0 flex-1">
          <Link
            className="block truncate font-medium hover:underline"
            href={`/students/${student.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            {student.fullName}
          </Link>
          <span className="block truncate text-muted-foreground text-xs">
            {student.code}
          </span>
        </div>
        <StudentRowActions student={student} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-sm">
          {student.level?.name ?? "-"}
        </span>
        <StudentStatusBadge status={student.status} />
      </div>
    </div>
  );
}
