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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { PlusIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createSubject } from "./actions";
import {
  DEFAULT_SUBJECT_ICON,
  SUBJECT_CATEGORIES,
  SUBJECT_ICONS,
} from "./subject-catalog";

export const AddSubjectDialog = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("GENERAL");
  const [icon, setIcon] = useState(DEFAULT_SUBJECT_ICON);
  const [state, formAction, isPending] = useActionState(
    async (_state: { error?: string }, formData: FormData) => {
      const result = await createSubject(formData);

      if (!result.error) {
        setOpen(false);
      }

      return result;
    },
    {}
  );

  useEffect(() => {
    if (state.error) {
      toastManager.add({ title: state.error, type: "error" });
    }
  }, [state.error]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="flex-1 md:flex-none" />}>
        <PlusIcon className="size-4" />
        Add Subject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a subject</DialogTitle>
          <DialogDescription>
            Subjects become the basis for monthly-per-subject fees.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Subject name</Label>
            <Input id="name" name="name" placeholder="Mathematics" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              maxLength={4}
              name="code"
              placeholder="MATH"
              required
            />
            <p className="text-muted-foreground text-xs">
              Max 4 alphanumeric characters. Used to build class codes.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              name="category"
              onValueChange={(value) => setCategory(value ?? "GENERAL")}
              value={category}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="icon">Icon</Label>
            <Select
              name="icon"
              onValueChange={(value) => setIcon(value ?? DEFAULT_SUBJECT_ICON)}
              value={icon}
            >
              <SelectTrigger id="icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUBJECT_ICONS).map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button disabled={isPending} type="submit">
              <PlusIcon className="size-4" />
              Add subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
