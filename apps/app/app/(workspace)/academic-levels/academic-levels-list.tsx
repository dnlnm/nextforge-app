"use client";

import type { LevelStage } from "@repo/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  BookOpenIcon,
  CheckIcon,
  GraduationCapIcon,
  LayersIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SchoolIcon,
  SearchIcon,
  Undo2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { archiveLevel, restoreLevel, updateLevel } from "./actions";

interface LevelSummary {
  readonly classCount: number;
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly stage: LevelStage;
  readonly studentCount: number;
}

interface StageGroup {
  readonly levels: LevelSummary[];
  readonly stage: LevelStage;
}

interface AcademicLevelsListProps {
  readonly archived: LevelSummary[];
  readonly grouped: StageGroup[];
}

type LevelView = "active" | "archived";

const STAGE_META: Record<
  LevelStage,
  { description: string; icon: LucideIcon; label: string }
> = {
  PRIMARY: {
    description: "Sekolah Rendah · Standard 1–6",
    icon: SchoolIcon,
    label: "Primary",
  },
  LOWER_SECONDARY: {
    description: "Menengah Rendah · Form 1–3",
    icon: BookOpenIcon,
    label: "Lower Secondary",
  },
  UPPER_SECONDARY: {
    description: "Menengah Atas · Form 4–5 · SPM",
    icon: LibraryIcon,
    label: "Upper Secondary",
  },
  PRE_UNIVERSITY: {
    description: "Form 6 · STPM · Matriculation",
    icon: GraduationCapIcon,
    label: "Pre-University",
  },
  GENERAL: {
    description: "Ungrouped levels",
    icon: LayersIcon,
    label: "General",
  },
};

export const AcademicLevelsList = ({
  grouped,
  archived,
}: AcademicLevelsListProps) => {
  const [activeTab, setActiveTab] = useState<string>(
    () =>
      grouped.find((group) => group.levels.length > 0)?.stage ??
      grouped[0]?.stage ??
      ""
  );
  const [view, setView] = useState<LevelView>("active");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [query, setQuery] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<LevelSummary | null>(null);

  const startEdit = (level: LevelSummary) => {
    setEditingId(level.id);
    setEditingName(level.name);
    setEditingCode(level.code);
  };

  const nonEmptyGroups = grouped.filter((group) => group.levels.length > 0);
  const totalLevels = grouped.reduce(
    (total, group) => total + group.levels.length,
    0
  );

  const visibleGroups = useMemo(() => {
    return grouped.filter((group) => group.stage === activeTab);
  }, [activeTab, grouped]);

  const filteredLevels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleGroups.flatMap((group) =>
      normalizedQuery
        ? group.levels.filter((level) =>
            level.name.toLowerCase().includes(normalizedQuery)
          )
        : group.levels
    );
  }, [query, visibleGroups]);

  const filteredArchivedLevels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery
      ? archived.filter((level) =>
          level.name.toLowerCase().includes(normalizedQuery)
        )
      : archived;
  }, [query, archived]);

  const displayedLevels =
    view === "active" ? filteredLevels : filteredArchivedLevels;

  let emptyStateText: string;

  if (view === "active") {
    emptyStateText =
      totalLevels === 0
        ? "No levels yet. Add one to get started."
        : "No levels match your search.";
  } else {
    emptyStateText =
      archived.length === 0
        ? "No archived levels."
        : "No archived levels match your search.";
  }

  const tabs = grouped
    .filter((group) => group.levels.length > 0)
    .map((group) => ({
      value: group.stage,
      label: STAGE_META[group.stage].label,
      count: group.levels.length,
    }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Academic levels</CardTitle>
          <CardDescription>
            {totalLevels} levels across {nonEmptyGroups.length} education
            stages. Used in class and student forms.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
              <button
                className={
                  view === "active"
                    ? "rounded-md bg-background px-3 py-1 font-medium text-sm shadow"
                    : "rounded-md px-3 py-1 font-medium text-muted-foreground text-sm"
                }
                onClick={() => setView("active")}
                type="button"
              >
                Active
              </button>
              <button
                className={
                  view === "archived"
                    ? "rounded-md bg-background px-3 py-1 font-medium text-sm shadow"
                    : "rounded-md px-3 py-1 font-medium text-muted-foreground text-sm"
                }
                onClick={() => setView("archived")}
                type="button"
              >
                Archived ({archived.length})
              </button>
            </div>
            {view === "active" && (
              <div className="overflow-x-auto">
                <Tabs onValueChange={setActiveTab} value={activeTab}>
                  <TabsList className="w-fit">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        className="flex-none"
                        key={tab.value}
                        value={tab.value}
                      >
                        {tab.label}
                        <span className="text-muted-foreground text-xs">
                          {tab.count}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}
            <div className="relative md:ml-auto md:min-w-56">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search levels..."
                value={query}
              />
            </div>
          </div>

          {displayedLevels.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              {emptyStateText}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLevels.map((level) => {
                  const isEditing = editingId === level.id;
                  const isArchived = view === "archived";

                  return (
                    <TableRow key={level.id}>
                      <TableCell>
                        {isEditing ? (
                          <form
                            action={async (formData) => {
                              await updateLevel(formData);
                              setEditingId(null);
                            }}
                            className="flex items-center gap-2"
                            id={`level-edit-form-${level.id}`}
                          >
                            <input
                              name="levelId"
                              type="hidden"
                              value={level.id}
                            />
                            <input
                              name="stage"
                              type="hidden"
                              value={level.stage}
                            />
                            <Input
                              className="max-w-52"
                              name="name"
                              onChange={(event) =>
                                setEditingName(event.target.value)
                              }
                              value={editingName}
                            />
                            <Button
                              aria-label="Save"
                              size="sm"
                              type="submit"
                              variant="secondary"
                            >
                              <CheckIcon className="size-4" />
                            </Button>
                          </form>
                        ) : (
                          <span className="font-medium">{level.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            className="max-w-20"
                            form={`level-edit-form-${level.id}`}
                            maxLength={4}
                            name="code"
                            onChange={(event) =>
                              setEditingCode(event.target.value)
                            }
                            value={editingCode}
                          />
                        ) : (
                          <Badge variant="outline">{level.code}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{level.classCount}</TableCell>
                      <TableCell>{level.studentCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label={`Actions for ${level.name}`}
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isArchived ? (
                              <DropdownMenuItem
                                onClick={async () => {
                                  const formData = new FormData();
                                  formData.set("levelId", level.id);
                                  await restoreLevel(formData);
                                }}
                              >
                                <Undo2Icon className="size-4" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => startEdit(level)}
                                >
                                  <PencilIcon className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setArchiveTarget(level)}
                                >
                                  <ArchiveIcon className="size-4" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setArchiveTarget(null);
          }
        }}
        open={archiveTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlink the level from any classes and students that use
              it. You can’t undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!archiveTarget) {
                  return;
                }

                const formData = new FormData();
                formData.set("levelId", archiveTarget.id);
                await archiveLevel(formData);
                setArchiveTarget(null);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
