"use client";

import { Button } from "@repo/design-system/components/ui/button";
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
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { updateSubject } from "../../actions";
import {
  DEFAULT_SUBJECT_ICON,
  SUBJECT_CATEGORIES,
  SUBJECT_ICONS,
} from "../../subject-catalog";

interface EditSubjectFormProperties {
  readonly category: string;
  readonly code: string;
  readonly description: string | null;
  readonly icon: string;
  readonly name: string;
  readonly subjectId: string;
}

export const EditSubjectForm = ({
  category: initialCategory,
  code,
  description,
  icon: initialIcon,
  name,
  subjectId,
}: EditSubjectFormProperties) => {
  const [category, setCategory] = useState(initialCategory);
  const [icon, setIcon] = useState(initialIcon);
  const [state, formAction, isPending] = useActionState(
    async (_state: { error?: string }, formData: FormData) =>
      updateSubject(formData),
    {}
  );

  useEffect(() => {
    if (state.error) {
      toastManager.add({ title: state.error, type: "error" });
    }
  }, [state.error]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="subjectId" type="hidden" value={subjectId} />
      <div className="grid gap-2">
        <Label htmlFor="name">Subject name</Label>
        <Input defaultValue={name} id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          defaultValue={code}
          id="code"
          maxLength={4}
          name="code"
          required
        />
        <p className="text-muted-foreground text-xs">
          Max 4 alphanumeric characters. Used to build class codes.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          defaultValue={description ?? ""}
          id="description"
          name="description"
        />
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
      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          Save changes
        </Button>
        <Button
          render={<Link href={`/subjects/${subjectId}`} />}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
