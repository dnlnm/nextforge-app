"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateCentreProfile } from "./actions";

interface CentreSettingsFormProps {
  organization: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

export const CentreSettingsForm = ({
  organization,
}: CentreSettingsFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(organization.name);
  const [imageUrl, setImageUrl] = useState(organization.imageUrl ?? "");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await updateCentreProfile(organization.id, {
        name,
        imageUrl: imageUrl || null,
      });
      toast.success("Centre profile updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Centre Name</Label>
        <Input
          disabled={loading}
          id="name"
          minLength={3}
          onChange={(event) => setName(event.target.value)}
          placeholder="Bright Mind Academy"
          required
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Logo URL (optional)</Label>
        <Input
          disabled={loading}
          id="imageUrl"
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/logo.png"
          type="url"
          value={imageUrl}
        />
        {imageUrl ? (
          <Image
            alt="Logo preview"
            className="mt-2 size-16 rounded object-cover"
            height={64}
            onError={() => setImageUrl("")}
            src={imageUrl}
            unoptimized
            width={64}
          />
        ) : null}
      </div>

      <Button disabled={loading} type="submit">
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};
