"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateProfileName } from "./actions";

interface ProfileFormProps {
  defaultName: string;
}

export const ProfileForm = ({ defaultName }: ProfileFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultName);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await updateProfileName(name);
      toast.success("Name updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update name"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          autoComplete="name"
          disabled={loading}
          id="name"
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Daniel Tan"
          required
          value={name}
        />
      </div>

      <Button disabled={loading} type="submit">
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};
