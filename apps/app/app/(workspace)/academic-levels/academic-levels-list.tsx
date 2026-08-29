"use client";

import type { LevelStage } from "@repo/database";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
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
  TabsPanel,
  TabsTab,
} from "@repo/design-system/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  BookOpenIcon,
  GraduationCapIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SchoolIcon,
  SearchIcon,
  Undo2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { archiveLevel, restoreLevel } from "./actions";
import { AddLevelDialog } from "./add-level-dialog";
import { EditLevelDialog } from "./edit-level-dialog";

export interface LevelSummary {
  readonly classCount: number;
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly stage: LevelStage;
  readonly studentCount: number;
}

export interface LevelGroup {
  readonly id: string;
  readonly levels: LevelSummary[];
}

interface AcademicLevelsListProps {
  readonly archivedGroups: LevelGroup[];
  readonly groups: LevelGroup[];
}

type LevelView = "active" | "archived";

interface GroupMeta {
  readonly description: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly range: string;
}

const GROUP_META: Record<string, GroupMeta> = {
  PRIMARY: {
    description: "Sekolah Rendah · Standard 1–6",
    icon: SchoolIcon,
    label: "Primary School",
    range: "Year 1–6",
  },
  SECONDARY: {
    description: "Sekolah Menengah · Form 1–5 · SPM",
    icon: BookOpenIcon,
    label: "Secondary School",
    range: "Form 1–5",
  },
  PRE_UNIVERSITY: {
    description: "Form 6 · STPM · Matriculation",
    icon: GraduationCapIcon,
    label: "Pre-University",
    range: "STPM · Matriculation",
  },
  GENERAL: {
    description: "Ungrouped levels",
    icon: LayersIcon,
    label: "General",
    range: "Ungrouped",
  },
};

const getGroupMeta = (id: string): GroupMeta =>
  GROUP_META[id] ?? GROUP_META.GENERAL;

const StatusPill = ({ archived }: { readonly archived: boolean }) =>
  archived ? (
    <Badge className="gap-1.5 text-muted-foreground" variant="secondary">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      Archived
    </Badge>
  ) : (
    <Badge className="gap-1.5 text-success" variant="success">
      <span className="size-1.5 rounded-full bg-success" />
      Active
    </Badge>
  );

const StageTab = ({
  isActive,
  id,
}: {
  readonly id: string;
  readonly isActive: boolean;
}) => {
  const meta = getGroupMeta(id);
  const Icon = meta.icon;

  return (
    <TabsTab className="max-lg:min-w-56 lg:h-auto lg:px-3 lg:py-2.5" value={id}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="min-w-0 text-start">
        <span
          className={
            isActive
              ? "block truncate font-semibold"
              : "block truncate font-medium text-muted-foreground"
          }
        >
          {meta.label}
        </span>
        <span className="block truncate font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          {meta.range}
        </span>
      </div>
    </TabsTab>
  );
};

const SectionHeader = ({
  canAddLevel,
  meta,
  onAddLevel,
}: {
  readonly canAddLevel: boolean;
  readonly meta: GroupMeta;
  readonly onAddLevel: () => void;
}) => {
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-muted/30 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-lg">{meta.label}</h2>
          <p className="hidden text-muted-foreground text-sm sm:block">
            {meta.description}
          </p>
        </div>
        <Badge
          className="hidden text-[10px] uppercase tracking-wider sm:inline-flex"
          variant="secondary"
        >
          {meta.range}
        </Badge>
      </div>
      {canAddLevel && (
        <Menu>
          <MenuTrigger
            render={
              <Button
                aria-label={`Options for ${meta.label}`}
                size="icon"
                variant="ghost"
              />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem onClick={onAddLevel}>
              <PlusIcon aria-hidden="true" className="size-4" />
              Add level here
            </MenuItem>
          </MenuContent>
        </Menu>
      )}
    </div>
  );
};

const RowActions = ({
  canRestore,
  level,
  onArchive,
  onEdit,
  onRestore,
}: {
  readonly canRestore: boolean;
  readonly level: LevelSummary;
  readonly onArchive: () => void;
  readonly onEdit: () => void;
  readonly onRestore: () => void;
}) => {
  if (canRestore) {
    return (
      <Button
        aria-label={`Restore ${level.name}`}
        className="text-muted-foreground hover:text-foreground"
        onClick={onRestore}
        size="icon-xs"
        variant="ghost"
      >
        <Undo2Icon aria-hidden="true" className="size-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        aria-label={`Edit ${level.name}`}
        className="text-muted-foreground hover:text-primary"
        onClick={onEdit}
        size="icon-xs"
        variant="ghost"
      >
        <PencilIcon aria-hidden="true" className="size-4" />
      </Button>
      <Button
        aria-label={`Archive ${level.name}`}
        className="text-muted-foreground hover:text-destructive"
        onClick={onArchive}
        size="icon-xs"
        variant="ghost"
      >
        <ArchiveIcon aria-hidden="true" className="size-4" />
      </Button>
    </>
  );
};

const StagePanel = ({
  archived,
  group,
  onAddLevel,
  onArchive,
  onEdit,
  onRestore,
  query,
}: {
  readonly archived: boolean;
  readonly group: LevelGroup;
  readonly onAddLevel: (stageId: string) => void;
  readonly onArchive: (level: LevelSummary) => void;
  readonly onEdit: (level: LevelSummary) => void;
  readonly onRestore: (level: LevelSummary) => void;
  readonly query: string;
}) => {
  const meta = getGroupMeta(group.id);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredLevels = normalizedQuery
    ? group.levels.filter((level) =>
        level.name.toLowerCase().includes(normalizedQuery)
      )
    : group.levels;

  let emptyTitle: string;
  let emptyDescription: string;

  if (archived) {
    if (group.levels.length === 0) {
      emptyTitle = "No archived levels here";
      emptyDescription = `Levels archived from ${meta.label} appear here so you can restore them.`;
    } else {
      emptyTitle = "No results";
      emptyDescription = "No archived levels match your search.";
    }
  } else if (group.levels.length === 0) {
    emptyTitle = `No levels in ${meta.label} yet`;
    emptyDescription = "Add the first level to this stage to get started.";
  } else {
    emptyTitle = "No results";
    emptyDescription = "No levels match your search.";
  }

  return (
    <Card>
      <CardContent className="p-0">
        <SectionHeader
          canAddLevel={!archived}
          meta={meta}
          onAddLevel={() => onAddLevel(group.id)}
        />

        {filteredLevels.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
            {!archived && (
              <EmptyContent>
                <Button
                  onClick={() => onAddLevel(group.id)}
                  size="sm"
                  variant="outline"
                >
                  <PlusIcon aria-hidden="true" className="size-4" />
                  Add level
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead>Student Count</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Active Classes
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLevels.map((level) => (
                    <TableRow className="group" key={level.id}>
                      <TableCell className="font-medium">
                        {archived ? (
                          level.name
                        ) : (
                          <Link
                            className="hover:underline"
                            href={`/academic-levels/${level.id}`}
                          >
                            {level.name}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {level.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {level.studentCount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {level.classCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusPill archived={archived} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <RowActions
                            canRestore={archived}
                            level={level}
                            onArchive={() => onArchive(level)}
                            onEdit={() => onEdit(level)}
                            onRestore={() => onRestore(level)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t px-5 py-3 text-center">
              <p className="text-muted-foreground text-xs">
                {filteredLevels.length} {archived ? "archived " : ""}level
                {filteredLevels.length === 1 ? "" : "s"} in {meta.label}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const AcademicLevelsList = ({
  archivedGroups,
  groups,
}: AcademicLevelsListProps) => {
  const [activeGroup, setActiveGroup] = useState<string>(
    () =>
      groups.find((group) => group.levels.length > 0)?.id ?? groups[0]?.id ?? ""
  );
  const [view, setView] = useState<LevelView>("active");
  const [editingLevel, setEditingLevel] = useState<LevelSummary | null>(null);
  const [query, setQuery] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<LevelSummary | null>(null);
  const [addLevelOpen, setAddLevelOpen] = useState(false);
  const [addLevelStage, setAddLevelStage] = useState("PRIMARY");

  const totalArchived = archivedGroups.reduce(
    (total, group) => total + group.levels.length,
    0
  );

  const openAddLevelDialog = (stage: string) => {
    setAddLevelStage(stage);
    setAddLevelOpen(true);
  };

  const handleRestore = async (level: LevelSummary) => {
    const formData = new FormData();
    formData.set("levelId", level.id);
    await restoreLevel(formData);
  };

  const handleArchive = async (level: LevelSummary) => {
    const formData = new FormData();
    formData.set("levelId", level.id);
    await archiveLevel(formData);
    setArchiveTarget(null);
  };

  const displayGroups = view === "active" ? groups : archivedGroups;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Academic Levels &amp; Stages
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage curricula, student distributions, and class allocations
            across all educational tiers.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Tabs
            className="max-sm:w-full"
            onValueChange={(value) => {
              if (value === "active" || value === "archived") {
                setView(value);
              }
            }}
            value={view}
          >
            <TabsList className="max-sm:w-full">
              <TabsTab value="active">Active</TabsTab>
              <TabsTab value="archived">Archived ({totalArchived})</TabsTab>
            </TabsList>
          </Tabs>
          <div className="relative sm:min-w-56">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter levels..."
              value={query}
            />
          </div>
          <AddLevelDialog
            initialStage={addLevelStage}
            onOpenChange={setAddLevelOpen}
            open={addLevelOpen}
          />
        </div>
      </div>

      <Tabs
        className="w-full gap-5 data-[orientation=vertical]:max-lg:flex-col lg:items-start"
        onValueChange={(value) => {
          if (value !== null) {
            setActiveGroup(value);
          }
        }}
        orientation="vertical"
        value={activeGroup}
      >
        <TabsList
          aria-label="Education stages"
          className="max-lg:justify-start data-[orientation=vertical]:max-lg:w-full data-[orientation=vertical]:max-lg:flex-row data-[orientation=vertical]:max-lg:overflow-x-auto lg:w-72 lg:flex-none data-[orientation=vertical]:max-lg:[scrollbar-width:none] data-[orientation=vertical]:max-lg:[&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group) => (
            <StageTab
              id={group.id}
              isActive={group.id === activeGroup}
              key={group.id}
            />
          ))}
        </TabsList>
        {displayGroups.map((group) => (
          <TabsPanel className="min-w-0 flex-1" key={group.id} value={group.id}>
            <StagePanel
              archived={view === "archived"}
              group={group}
              onAddLevel={openAddLevelDialog}
              onArchive={setArchiveTarget}
              onEdit={setEditingLevel}
              onRestore={(level) => handleRestore(level)}
              query={query}
            />
          </TabsPanel>
        ))}
      </Tabs>

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
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              onClick={async () => {
                if (archiveTarget) {
                  await handleArchive(archiveTarget);
                }
              }}
            >
              Archive
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditLevelDialog
        level={editingLevel}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLevel(null);
          }
        }}
      />
    </div>
  );
};
