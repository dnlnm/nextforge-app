"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  BookOpenIcon,
  ChevronRightIcon,
  Edit3Icon,
  MoreHorizontalIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Balancer from "react-wrap-balancer";
import { archiveSubject } from "./actions";

export interface SubjectSummary {
  classes: number;
  description: string | null;
  id: string;
  name: string;
  status: string;
  students: number;
  teachers: number;
}

const SubjectsList = ({
  subjects,
}: {
  readonly subjects: SubjectSummary[];
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjects[0]?.id ?? null
  );
  const selectedSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ?? null;

  const summaryStats: Array<{
    icon: LucideIcon;
    label: string;
    value: number;
  }> = [
    {
      icon: BookOpenIcon,
      label: "Classes",
      value: selectedSubject?.classes ?? 0,
    },
    {
      icon: UsersRoundIcon,
      label: "Students",
      value: selectedSubject?.students ?? 0,
    },
    {
      icon: UserRoundIcon,
      label: "Teachers",
      value: selectedSubject?.teachers ?? 0,
    },
  ];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>{subjects.length} active subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow
                  className="cursor-pointer"
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  <TableCell className="font-medium">
                    <Balancer>{subject.name}</Balancer>
                  </TableCell>
                  <TableCell>{subject.classes}</TableCell>
                  <TableCell>{subject.students}</TableCell>
                  <TableCell className="text-right">
                    <form action={archiveSubject}>
                      <input
                        name="subjectId"
                        type="hidden"
                        value={subject.id}
                      />
                      <Button
                        onClick={(event) => event.stopPropagation()}
                        size="icon"
                        type="submit"
                        variant="ghost"
                      >
                        <ArchiveIcon className="size-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <Card>
          {selectedSubject ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                    <BookOpenIcon className="size-10" />
                  </div>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl">
                    <Balancer>{selectedSubject.name}</Balancer>
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    <Badge variant="outline">
                      {selectedSubject.status === "ACTIVE"
                        ? "Active"
                        : "Archived"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-0">
                <section className="grid gap-3 border-b p-4">
                  <h2 className="font-semibold text-sm">Subject Information</h2>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground text-xs">
                      Description
                    </span>
                    <p className="text-sm">
                      {selectedSubject.description ??
                        "No description recorded."}
                    </p>
                  </div>
                </section>
                <section className="grid grid-cols-3 gap-3 border-b p-4">
                  {summaryStats.map(({ icon: Icon, label, value }) => (
                    <div className="grid gap-1 text-center" key={label}>
                      <div className="mx-auto flex size-9 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <p className="font-semibold text-xl">{value}</p>
                      <p className="text-muted-foreground text-xs">{label}</p>
                    </div>
                  ))}
                </section>
                <section className="grid gap-2 p-4">
                  <Button asChild>
                    <Link href={`/subjects/${selectedSubject.id}`}>
                      View Full Profile
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/subjects/${selectedSubject.id}/edit`}>
                        <Edit3Icon className="size-4" />
                        Edit
                      </Link>
                    </Button>
                    <form action={archiveSubject}>
                      <input
                        name="subjectId"
                        type="hidden"
                        value={selectedSubject.id}
                      />
                      <Button className="w-full" variant="outline">
                        <ArchiveIcon className="size-4" />
                        Archive
                      </Button>
                    </form>
                  </div>
                </section>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No subjects to display.
            </CardContent>
          )}
        </Card>
      </aside>
    </div>
  );
};

export default SubjectsList;
