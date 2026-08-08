"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateEmail } from "./actions";

interface EmailFormProps {
  defaultEmail: string;
}

export const EmailForm = ({ defaultEmail }: EmailFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await updateEmail(email);
      toast.success(
        "Confirmation email sent. Check your inbox to complete the change."
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          disabled={loading}
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="m@example.com"
          required
          type="email"
          value={email}
        />
        <p className="text-muted-foreground text-xs">
          A confirmation link will be sent to your new address before the change
          takes effect.
        </p>
      </div>

      <Button disabled={loading} type="submit">
        {loading ? "Saving..." : "Update Email"}
      </Button>
    </form>
  );
};
