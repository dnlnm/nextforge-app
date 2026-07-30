"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { ImageUpIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createOrganization } from "../actions";

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
      Create centre
    </Button>
  );
};

const parseUploadResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as { error?: string; url?: string };
  }

  const text = await response.text();

  return text ? { error: text } : {};
};

export const OrganizationOnboarding = () => {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = (file: File | null) => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (logo) {
        const uploadFormData = new FormData();
        uploadFormData.append("logo", logo);

        const response = await fetch("/api/uploads/centre-logo", {
          method: "POST",
          body: uploadFormData,
        });

        const payload = await parseUploadResponse(response);

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to upload logo.");
        }

        imageUrl = payload.url;
      }

      await createOrganization(name, imageUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create centre. Please try again."
      );
    }
  };

  return (
    <form className="grid gap-5" onSubmit={create}>
      <div className="grid gap-2">
        <Label htmlFor="organization-name">Centre name</Label>
        <Input
          autoComplete="organization"
          id="organization-name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Bright Minds Tuition"
          required
          value={name}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="organization-logo">Centre logo</Label>
        <label
          className="grid cursor-pointer gap-4 border bg-muted/30 p-4 transition hover:bg-muted/60"
          htmlFor="organization-logo"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden border bg-background text-muted-foreground">
              {logoPreview ? (
                // Local preview only; the uploaded image is persisted after submit.
                <Image
                  alt="Centre logo preview"
                  className="object-cover"
                  height={56}
                  src={logoPreview}
                  width={56}
                />
              ) : (
                <ImageUpIcon className="size-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">
                {logo ? logo.name : "Upload a logo"}
              </p>
              <p className="text-muted-foreground text-xs">
                Optional. PNG, JPG, or WebP up to 2MB.
              </p>
            </div>
          </div>
        </label>
        <Input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          id="organization-logo"
          name="logo"
          onChange={(event) =>
            handleLogoChange(event.target.files?.[0] ?? null)
          }
          type="file"
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <SubmitButton />
    </form>
  );
};
