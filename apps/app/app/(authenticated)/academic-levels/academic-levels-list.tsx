"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { Input } from "@repo/design-system/components/ui/input";
import { CheckIcon, GripVerticalIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { archiveLevel, createLevel, updateLevel } from "./actions";

interface Level {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly classCount: number;
  readonly studentCount: number;
}

interface AcademicLevelsListProps {
  readonly levels: Level[];
}

export const AcademicLevelsList = ({ levels }: AcademicLevelsListProps) => {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const startEdit = (level: Level) => {
    setEditingId(level.id);
    setEditingName(level.name);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4">
        {levels.map((level) => {
          const isEditing = editingId === level.id;

          return (
            <div
              className="flex items-center gap-3 rounded-md border p-3"
              key={level.id}
            >
              <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground" />
              {isEditing ? (
                <form
                  action={async (formData) => {
                    await updateLevel(formData);
                    setEditingId(null);
                  }}
                  className="flex flex-1 items-center gap-2"
                >
                  <input name="levelId" type="hidden" value={level.id} />
                  <Input
                    className="flex-1"
                    name="name"
                    onChange={(event) => setEditingName(event.target.value)}
                    value={editingName}
                  />
                  <Button size="sm" type="submit" variant="secondary">
                    <CheckIcon className="size-4" />
                  </Button>
                </form>
              ) : (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{level.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.classCount} class
                      {level.classCount === 1 ? "" : "es"} ·{" "}
                      {level.studentCount} student
                      {level.studentCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Actions">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(level)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async () => {
                          const formData = new FormData();
                          formData.set("levelId", level.id);

                          if (
                            window.confirm(
                              `Archive "${level.name}"? Classes and students using it will be unlinked.`
                            )
                          ) {
                            await archiveLevel(formData);
                          }
                        }}
                      >
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {levels.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No levels yet. Add one below to get started.
        </p>
      )}

      <form
        action={async (formData) => {
          await createLevel(formData);
          setNewName("");
        }}
        className="flex items-center gap-2"
      >
        <Input
          name="name"
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Add a level, e.g. Form 6"
          value={newName}
        />
        <Button type="submit" variant="outline">
          Add
        </Button>
      </form>
    </div>
  );
};