"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { LevelSummary } from "./academic-levels-list";
import { updateLevel } from "./actions";
import { STAGE_OPTIONS } from "./add-level-dialog";

interface EditLevelDialogProps {
  readonly level: LevelSummary | null;
  readonly onOpenChange: (open: boolean) => void;
}

export const EditLevelDialog = ({
  level,
  onOpenChange,
}: EditLevelDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("PRIMARY");

  useEffect(() => {
    if (!level) {
      return;
    }
    setName(level.name);
    setCode(level.code);
    setStage(level.stage);
  }, [level]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
      open={level !== null}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {level?.name}</DialogTitle>
          <DialogDescription>
            Update the level name, code, or education stage.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await updateLevel(formData);
            onOpenChange(false);
          }}
          className="grid gap-4"
        >
          <input name="levelId" type="hidden" value={level?.id ?? ""} />
          <div className="grid gap-2">
            <Label htmlFor="edit-stage">Stage</Label>
            <Select
              name="stage"
              onValueChange={(value) => setStage(value ?? "")}
              value={stage}
            >
              <SelectTrigger id="edit-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Level name</Label>
            <Input
              id="edit-name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-code">Code</Label>
            <Input
              id="edit-code"
              maxLength={4}
              name="code"
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g. Y3"
              required
              value={code}
            />
            <p className="text-muted-foreground text-xs">
              Max 4 alphanumeric characters. Used to build class codes.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit">
              <CheckIcon className="size-4" />
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
