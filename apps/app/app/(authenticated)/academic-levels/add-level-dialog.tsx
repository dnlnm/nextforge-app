"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { createLevel } from "./actions";

export const STAGE_OPTIONS = [
  { value: "PRIMARY", label: "Primary (Year 1–6)" },
  { value: "LOWER_SECONDARY", label: "Lower Secondary (Form 1–3)" },
  { value: "UPPER_SECONDARY", label: "Upper Secondary (Form 4–5)" },
  { value: "PRE_UNIVERSITY", label: "Pre-University (Form 6, STPM)" },
  { value: "GENERAL", label: "General / Other" },
] as const;

export const AddLevelDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stage, setStage] = useState("PRIMARY");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 md:flex-none">
          <PlusIcon className="size-4" />
          Add Level
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a level</DialogTitle>
          <DialogDescription>
            Grouped by Malaysian education stage. These appear in class and
            student forms.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createLevel(formData);
            setName("");
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="stage">Stage</Label>
            <Select name="stage" onValueChange={setStage} value={stage}>
              <SelectTrigger id="stage">
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
            <Label htmlFor="name">Level name</Label>
            <Input
              id="name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Year 3"
              required
              value={name}
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              <PlusIcon className="size-4" />
              Add level
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
