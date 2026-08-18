"use client";

import type { LevelStage, SubjectCategory } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@repo/design-system/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import {
  ArchiveIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit3Icon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { archiveSubject } from "./actions";
import { AddSubjectDialog } from "./add-subject-dialog";
import {
  getSubjectIconOption,
  SUBJECT_CATEGORIES,
  SUBJECT_CATEGORY_LABELS,
} from "./subject-catalog";

export interface SubjectSummary {
  category: SubjectCategory;
  classCount: number;
  code: string;
  description: string | null;
  icon: string;
  id: string;
  levelNames: string[];
  name: string;
  stages: LevelStage[];
  studentCount: number;
  teacherCount: number;
}

const PAGE_SIZE = 5;

const STAGE_TABS: readonly {
  readonly id: string;
  readonly label: string;
  readonly stages: readonly LevelStage[];
}[] = [
  { id: "ALL", label: "All Stages", stages: [] },
  { id: "PRIMARY", label: "Primary", stages: ["PRIMARY"] },
  {
    id: "SECONDARY",
    label: "Secondary",
    stages: ["LOWER_SECONDARY", "UPPER_SECONDARY"],
  },
  {
    id: "PRE_UNIVERSITY",
    label: "Pre-University",
    stages: ["PRE_UNIVERSITY"],
  },
  { id: "GENERAL", label: "General", stages: ["GENERAL"] },
];

const matchesStage = (subject: SubjectSummary, stage: string) => {
  if (stage === "ALL") {
    return true;
  }

  const tab = STAGE_TABS.find((option) => option.id === stage);

  return tab
    ? tab.stages.some((candidate) => subject.stages.includes(candidate))
    : true;
};

const SubjectRow = ({
  onSelect,
  selected,
  subject,
}: {
  readonly onSelect: () => void;
  readonly selected: boolean;
  readonly subject: SubjectSummary;
}) => {
  const { Icon } = getSubjectIconOption(subject.icon);

  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-foreground bg-muted/40"
          : "bg-card hover:border-foreground/40 hover:bg-muted/20"
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {subject.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge className="font-mono text-xs" variant="outline">
              {subject.code}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {SUBJECT_CATEGORY_LABELS[subject.category]}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            {subject.classCount} class{subject.classCount === 1 ? "" : "es"} ·{" "}
            {subject.studentCount} student
            {subject.studentCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <ChevronRightIcon
        className={cn(
          "size-5 shrink-0",
          selected ? "text-foreground" : "text-muted-foreground"
        )}
      />
    </button>
  );
};

const EmptyState = ({
  hasFilters,
  query,
}: {
  readonly hasFilters: boolean;
  readonly query: string;
}) => {
  let title = "No subjects yet";
  let message =
    "Add your first subject to start building classes and monthly fees.";

  if (hasFilters) {
    title = "No matching subjects";
    message = query
      ? "Try a different name or code."
      : "Try adjusting the category or stage filters.";
  }

  return (
    <Empty>
      <EmptyContent>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpenIcon className="size-4.5" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyHeader>
        {hasFilters ? null : <AddSubjectDialog />}
      </EmptyContent>
    </Empty>
  );
};

const SubjectPanel = ({ subject }: { readonly subject: SubjectSummary }) => {
  const { Icon } = getSubjectIconOption(subject.icon);

  return (
    <Card className="gap-0 lg:sticky lg:top-4">
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">Subject Details</CardTitle>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <Button
                  aria-label="Edit subject"
                  render={<Link href={`/subjects/${subject.id}/edit`} />}
                  size="icon"
                  variant="ghost"
                />
              }
            >
              <Edit3Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit subject</p>
            </TooltipContent>
          </Tooltip>
          <form action={archiveSubject}>
            <input name="subjectId" type="hidden" value={subject.id} />
            <Tooltip>
              <TooltipTrigger
                delay={0}
                render={
                  <Button
                    aria-label="Archive subject"
                    className="text-muted-foreground hover:text-destructive"
                    size="icon"
                    type="submit"
                    variant="ghost"
                  />
                }
              >
                <ArchiveIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Archive subject</p>
              </TooltipContent>
            </Tooltip>
          </form>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
            <Icon className="size-8" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-lg">{subject.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className="font-mono text-xs" variant="outline">
                {subject.code}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {SUBJECT_CATEGORY_LABELS[subject.category]}
              </span>
            </div>
          </div>
        </div>

        {subject.description ? (
          <>
            <Separator />
            <p className="text-muted-foreground text-sm">
              {subject.description}
            </p>
          </>
        ) : null}

        <Separator />

        <div className="grid gap-3">
          <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Academic Levels
          </h4>
          {subject.levelNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subject.levelNames.map((levelName) => (
                <Badge key={levelName} variant="secondary">
                  {levelName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No classes yet.</p>
          )}
        </div>

        <Separator />

        <div className="grid gap-3">
          <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Assigned Teachers
          </h4>
          <div className="flex items-center gap-2">
            <UsersRoundIcon className="size-5 text-primary" />
            <span className="font-semibold text-lg tabular-nums">
              {subject.teacherCount}
            </span>
            <span className="text-muted-foreground text-sm">
              Active teacher{subject.teacherCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <Button
          className="w-full"
          render={<Link href={`/subjects/${subject.id}`} />}
          variant="outline"
        >
          View profile
        </Button>
      </CardContent>
    </Card>
  );
};

const PaginationBar = ({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  readonly onPageChange: (page: number) => void;
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
}) => {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm">
        Showing {start}–{end} of {total} subjects
      </p>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              aria-disabled={page === 1 ? true : undefined}
              aria-label="Go to previous page"
              className={cn(page === 1 && "pointer-events-none opacity-50")}
              href="#"
              onClick={(event) => {
                event.preventDefault();

                if (page > 1) {
                  onPageChange(page - 1);
                }
              }}
            >
              <ChevronLeftIcon />
            </PaginationLink>
          </PaginationItem>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            (candidate) => (
              <PaginationItem key={candidate}>
                <PaginationLink
                  href="#"
                  isActive={candidate === page}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(candidate);
                  }}
                >
                  {candidate}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationLink
              aria-disabled={page === pageCount ? true : undefined}
              aria-label="Go to next page"
              className={cn(
                page === pageCount && "pointer-events-none opacity-50"
              )}
              href="#"
              onClick={(event) => {
                event.preventDefault();

                if (page < pageCount) {
                  onPageChange(page + 1);
                }
              }}
            >
              <ChevronRightIcon />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

const SubjectsList = ({
  subjects,
}: {
  readonly subjects: SubjectSummary[];
}) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [stage, setStage] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return subjects.filter((subject) => {
      if (category !== "ALL" && subject.category !== category) {
        return false;
      }

      if (!matchesStage(subject, stage)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        subject.name.toLowerCase().includes(normalized) ||
        subject.code.toLowerCase().includes(normalized)
      );
    });
  }, [category, query, stage, subjects]);

  const selected =
    filtered.find((subject) => subject.id === selectedId) ??
    filtered[0] ??
    null;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="grid gap-5">
      <Card className="gap-0">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <Label
              className="mb-1.5 block font-medium text-muted-foreground text-xs uppercase tracking-wider"
              htmlFor="subject-search"
            >
              Search subjects
            </Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="subject-search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="e.g. Mathematics, BIO..."
                value={query}
              />
            </div>
          </div>
          <div className="w-full md:w-52">
            <Label
              className="mb-1.5 block font-medium text-muted-foreground text-xs uppercase tracking-wider"
              htmlFor="subject-category"
            >
              Category
            </Label>
            <Select
              name="subject-category"
              onValueChange={(value) => {
                setCategory(value ?? "ALL");
                setPage(1);
              }}
              value={category}
            >
              <SelectTrigger id="subject-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {SUBJECT_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs
        onValueChange={(value) => {
          setStage(value ?? "ALL");
          setPage(1);
        }}
        value={stage}
      >
        <TabsList className="gap-4" variant="underline">
          {STAGE_TABS.map((tab) => (
            <TabsTab key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[60%]">
          {visible.length === 0 ? (
            <Card className="gap-0">
              <EmptyState
                hasFilters={filtered.length !== subjects.length}
                query={query}
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  onSelect={() => setSelectedId(subject.id)}
                  selected={selected?.id === subject.id}
                  subject={subject}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <PaginationBar
              onPageChange={setPage}
              page={safePage}
              pageCount={pageCount}
              total={filtered.length}
            />
          ) : null}
        </div>

        <div className="w-full lg:w-[40%]">
          {selected ? <SubjectPanel subject={selected} /> : null}
        </div>
      </div>
    </div>
  );
};

export default SubjectsList;
