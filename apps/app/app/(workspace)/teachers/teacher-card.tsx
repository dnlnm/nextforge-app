"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Card } from "@repo/design-system/components/ui/card";
import { privateFileUrl } from "@repo/storage/client";
import Link from "next/link";

import { StudentAvatar } from "../components/student-avatar";

import { type Teacher, TeacherRowActions } from "./columns";

export function TeacherCard({
  onRowClick,
  teacher,
}: {
  onRowClick?: (teacher: Teacher) => void;
  teacher: Teacher;
}) {
  return (
    <Card
      className="isolate cursor-pointer p-4 transition-colors after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 hover:bg-muted/30 dark:bg-background"
      onClick={() => onRowClick?.(teacher)}
    >
      <div className="flex items-center gap-3">
        <StudentAvatar
          className="size-10"
          gender={teacher.gender}
          name={teacher.fullName}
          photoUrl={privateFileUrl(teacher.photoKey)}
        />
        <div className="min-w-0 flex-1">
          <Link
            className="block truncate font-medium hover:underline"
            href={`/teachers?teacherId=${teacher.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            {teacher.fullName}
          </Link>
          <span className="block truncate text-muted-foreground text-xs">
            {teacher.code}
          </span>
        </div>
        <TeacherRowActions teacher={teacher} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span className="text-muted-foreground text-sm">
          {teacher.branchName ?? "-"}
        </span>
        <span className="flex flex-wrap gap-1.5">
          {teacher.subjects.length > 0 ? (
            teacher.subjects.slice(0, 2).map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </span>
      </div>
    </Card>
  );
}
