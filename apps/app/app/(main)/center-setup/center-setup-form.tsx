"use client";

import { buildWorkspaceUrl } from "@repo/auth/domain";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { checkSlugAvailability, createCentre } from "./actions";

const deriveSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

export const CenterSetupForm = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      setSlugError(null);
      return;
    }

    if (slug.length < 3) {
      setSlugAvailable(false);
      setSlugError("Slug must be at least 3 characters");
      return;
    }

    let cancelled = false;
    setSlugChecking(true);
    setSlugError(null);
    setSlugAvailable(null);

    const timer = window.setTimeout(async () => {
      const result = await checkSlugAvailability(slug);
      if (cancelled) {
        return;
      }
      setSlugChecking(false);
      setSlugAvailable(result.available);
      if (!result.available) {
        setSlugError(result.reason ?? "That URL is not available");
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug]);

  const handleNameChange = (value: string) => {
    setName(value);
    const derived = deriveSlug(value);
    if (derived) {
      setSlug(derived);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await createCentre({ name: name.trim(), slug, imageUrl });
      const workspaceUrl = buildWorkspaceUrl(result.slug);
      toast.success("Centre created successfully!");
      window.location.href = workspaceUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create centre"
      );
      setLoading(false);
    }
  };

  const ready =
    name.trim().length >= 3 &&
    slug.length >= 3 &&
    slugAvailable === true &&
    !slugChecking;

  let slugStatusIcon: React.ReactNode = null;
  if (slugChecking) {
    slugStatusIcon = (
      <Loader2Icon className="size-5 shrink-0 animate-spin text-muted-foreground" />
    );
  } else if (slugAvailable) {
    slugStatusIcon = (
      <CheckCircle2Icon className="size-5 shrink-0 text-green-600" />
    );
  } else if (slugAvailable === false) {
    slugStatusIcon = (
      <XCircleIcon className="size-5 shrink-0 text-destructive" />
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Centre name *</Label>
        <Input
          disabled={loading}
          id="name"
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Bright Mind Academy"
          required
          value={name}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Centre URL *</Label>
        <div className="flex items-center gap-2">
          <Input
            className="font-mono"
            disabled={loading}
            id="slug"
            maxLength={50}
            minLength={3}
            onChange={(event) => setSlug(deriveSlug(event.target.value))}
            pattern="[a-z0-9-]+"
            placeholder="brightmind"
            required
            value={slug}
          />
          {slugStatusIcon}
        </div>
        {slug ? (
          <p className="text-muted-foreground text-xs">
            Your centre will be at: {slug}.tlas.my
          </p>
        ) : null}
        {slugError ? (
          <p className="text-destructive text-sm">{slugError}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
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
            className="mt-1 size-12 rounded object-cover"
            height={48}
            onError={() => setImageUrl("")}
            src={imageUrl}
            unoptimized
            width={48}
          />
        ) : null}
      </div>

      <Button disabled={loading || !ready || slugChecking} type="submit">
        {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
        {loading ? "Creating..." : "Create Centre"}
      </Button>
    </form>
  );
};
