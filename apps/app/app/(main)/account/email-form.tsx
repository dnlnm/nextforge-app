"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      toastManager.add({
        title:
          "Confirmation email sent. Check your inbox to complete the change.",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error ? error.message : "Failed to update email",
        type: "error",
      });
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
