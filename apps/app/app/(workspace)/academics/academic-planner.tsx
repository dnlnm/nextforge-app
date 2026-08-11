"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import { Input } from "@repo/design-system/components/ui/input";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface AcademicPlannerClass {
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly studentCount: number;
  readonly teacherName: string | null;
}

interface AcademicPlannerSubject {
  readonly classes: AcademicPlannerClass[];
  readonly id: string;
  readonly name: string;
}

interface AcademicPlannerLevel {
  readonly id: string;
  readonly name: string;
  readonly subjects: AcademicPlannerSubject[];
}

interface AcademicPlannerProps {
  readonly hierarchy: AcademicPlannerLevel[];
  readonly stats: {
    readonly activeClasses: number;
    readonly activeLevels: number;
    readonly activeSubjects: number;
  };
}

export const AcademicPlanner = ({ hierarchy, stats }: AcademicPlannerProps) => {
  const [query, setQuery] = useState("");
  const [openLevelIds, setOpenLevelIds] = useState<Set<string>>(
    () => new Set(hierarchy.map((level) => level.id))
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredHierarchy = useMemo(() => {
    if (!normalizedQuery) {
      return hierarchy;
    }

    return hierarchy
      .map((level) => ({
        ...level,
        subjects: level.subjects
          .map((subject) => ({
            ...subject,
            classes: subject.classes.filter(
              (learningClass) =>
                learningClass.name.toLowerCase().includes(normalizedQuery) ||
                learningClass.code.toLowerCase().includes(normalizedQuery)
            ),
          }))
          .filter(
            (subject) =>
              subject.classes.length > 0 ||
              subject.name.toLowerCase().includes(normalizedQuery)
          ),
      }))
      .filter(
        (level) =>
          level.subjects.length > 0 ||
          level.name.toLowerCase().includes(normalizedQuery)
      );
  }, [hierarchy, normalizedQuery]);

  const toggleLevel = (levelId: string) => {
    setOpenLevelIds((current) => {
      const next = new Set(current);

      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }

      return next;
    });
  };

  return (
    <div className="grid gap-5">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <StatValue label="Levels" value={stats.activeLevels} />
          <StatValue label="Subjects" value={stats.activeSubjects} />
          <StatValue label="Classes" value={stats.activeClasses} />
        </CardContent>
      </Card>

      <div className="relative md:max-w-md">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search levels, subjects, classes..."
          value={query}
        />
      </div>

      {filteredHierarchy.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No levels or classes match your search.
          </CardContent>
        </Card>
      ) : (
        filteredHierarchy.map((level) => {
          const isOpen = openLevelIds.has(level.id);

          return (
            <Collapsible
              key={level.id}
              onOpenChange={() => toggleLevel(level.id)}
              open={isOpen}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDownIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="size-4 text-muted-foreground" />
                      )}
                      <GraduationCapIcon className="size-5 text-muted-foreground" />
                      <span className="font-medium">
                        <Link
                          className="hover:underline"
                          href={`/academic-levels/${level.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {level.name}
                        </Link>
                      </span>
                      <Badge variant="secondary">
                        {level.subjects.length} subject
                        {level.subjects.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-3 border-t p-4">
                    {level.subjects.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No operational classes at this level yet. Create a class
                        with this level to see subjects here.
                      </p>
                    ) : (
                      level.subjects.map((subject) => (
                        <div
                          className="grid gap-2 rounded-md border p-3"
                          key={subject.id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              className="font-medium hover:underline"
                              href={`/subjects/${subject.id}`}
                            >
                              {subject.name}
                            </Link>
                            <Badge variant="outline">
                              {subject.classes.length} class
                              {subject.classes.length === 1 ? "" : "es"}
                            </Badge>
                          </div>
                          <div className="grid gap-1.5">
                            {subject.classes.map((learningClass) => (
                              <Link
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-accent"
                                href={`/classes/${learningClass.id}`}
                                key={learningClass.id}
                              >
                                <span>
                                  {learningClass.name}
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · {learningClass.code}
                                  </span>
                                </span>
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <UsersRoundIcon className="size-3.5" />
                                  {learningClass.studentCount}
                                  {learningClass.teacherName
                                    ? ` · ${learningClass.teacherName}`
                                    : ""}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })
      )}
    </div>
  );
};

const StatValue = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) => (
  <div className="rounded-lg border p-4 text-center">
    <p className="font-semibold text-2xl tracking-tight">{value}</p>
    <p className="text-muted-foreground text-xs">{label}</p>
  </div>
);
