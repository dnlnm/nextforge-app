"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSubject } from "../../actions";

interface EditSubjectFormProperties {
  readonly code: string;
  readonly description: string | null;
  readonly name: string;
  readonly subjectId: string;
}

export const EditSubjectForm = ({
  code,
  description,
  name,
  subjectId,
}: EditSubjectFormProperties) => {
  const [state, formAction, isPending] = useActionState(
    async (_state: { error?: string }, formData: FormData) =>
      updateSubject(formData),
    {}
  );

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
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
      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          Save changes
        </Button>
        <Button asChild variant="outline">
          <Link href={`/subjects/${subjectId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
};
