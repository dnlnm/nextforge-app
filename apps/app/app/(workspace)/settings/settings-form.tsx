"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { ImageUpIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateCentreSettings } from "./actions";

interface SettingsFormProps {
  readonly organization: {
    readonly imageUrl: string | null;
    readonly name: string;
    readonly settings: {
      readonly addressLine1: string | null;
      readonly addressLine2: string | null;
      readonly city: string | null;
      readonly defaultInvoiceDueDay: number;
      readonly email: string | null;
      readonly invoicePrefix: string;
      readonly paymentInstructions: string | null;
      readonly phone: string | null;
      readonly postcode: string | null;
      readonly receiptPrefix: string;
      readonly state: string | null;
    } | null;
  } | null;
}

const parseUploadResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as { error?: string; url?: string };
  }

  const text = await response.text();

  return text ? { error: text } : {};
};

const SubmitButton = ({ uploading }: { readonly uploading: boolean }) => {
  const { pending } = useFormStatus();
  const saving = pending || uploading;

  return (
    <Button disabled={saving} type="submit">
      {saving ? <Loader2Icon className="size-4 animate-spin" /> : null}
      Save settings
    </Button>
  );
};

export const SettingsForm = ({ organization }: SettingsFormProps) => {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(organization?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
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

  const save = async (formData: FormData) => {
    setError(null);
    setUploading(false);

    try {
      let uploadedImageUrl = imageUrl;

      if (logo) {
        setUploading(true);

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

        if (!payload.url) {
          throw new Error("Upload completed without an image URL.");
        }

        uploadedImageUrl = payload.url;
        setImageUrl(payload.url);
      }

      formData.set("imageUrl", uploadedImageUrl);
      await updateCentreSettings(formData);
      handleLogoChange(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save settings. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const displayImageUrl = logoPreview || imageUrl;
  let imageActionLabel = "Upload a centre image";

  if (imageUrl) {
    imageActionLabel = "Replace centre image";
  }

  if (logo) {
    imageActionLabel = logo.name;
  }

  return (
    <form action={save} className="grid gap-4">
      <input name="imageUrl" type="hidden" value={imageUrl} />
      <div className="grid gap-2">
        <Label htmlFor="centre-logo">Centre image</Label>
        <label
          className="grid cursor-pointer gap-4 border bg-muted/30 p-4 transition hover:bg-muted/60"
          htmlFor="centre-logo"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border bg-background text-muted-foreground">
              {displayImageUrl ? (
                <Image
                  alt="Centre image preview"
                  className="object-cover"
                  height={64}
                  src={displayImageUrl}
                  width={64}
                />
              ) : (
                <ImageUpIcon className="size-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{imageActionLabel}</p>
              <p className="text-muted-foreground text-xs">
                PNG, JPG, or WebP up to 2MB. Used as the centre image across the
                app.
              </p>
            </div>
          </div>
        </label>
        <Input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          id="centre-logo"
          name="logo"
          onChange={(event) =>
            handleLogoChange(event.target.files?.[0] ?? null)
          }
          type="file"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Centre name</Label>
        <Input
          defaultValue={organization?.name}
          id="name"
          name="name"
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            defaultValue={organization?.settings?.email ?? ""}
            id="email"
            name="email"
            type="email"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            defaultValue={organization?.settings?.phone ?? ""}
            id="phone"
            name="phone"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressLine1">Address line 1</Label>
        <Input
          defaultValue={organization?.settings?.addressLine1 ?? ""}
          id="addressLine1"
          name="addressLine1"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressLine2">Address line 2</Label>
        <Input
          defaultValue={organization?.settings?.addressLine2 ?? ""}
          id="addressLine2"
          name="addressLine2"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            defaultValue={organization?.settings?.city ?? ""}
            id="city"
            name="city"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Input
            defaultValue={organization?.settings?.state ?? ""}
            id="state"
            name="state"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            defaultValue={organization?.settings?.postcode ?? ""}
            id="postcode"
            name="postcode"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="invoicePrefix">Invoice prefix</Label>
          <Input
            defaultValue={organization?.settings?.invoicePrefix ?? "INV"}
            id="invoicePrefix"
            name="invoicePrefix"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="receiptPrefix">Receipt prefix</Label>
          <Input
            defaultValue={organization?.settings?.receiptPrefix ?? "RCP"}
            id="receiptPrefix"
            name="receiptPrefix"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="defaultInvoiceDueDay">Due day</Label>
          <Input
            defaultValue={organization?.settings?.defaultInvoiceDueDay ?? 7}
            id="defaultInvoiceDueDay"
            max="28"
            min="1"
            name="defaultInvoiceDueDay"
            required
            type="number"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paymentInstructions">Payment instructions</Label>
        <Textarea
          defaultValue={organization?.settings?.paymentInstructions ?? ""}
          id="paymentInstructions"
          name="paymentInstructions"
          placeholder="Bank account, DuitNow QR reference, or payment reminder notes."
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <SubmitButton uploading={uploading} />
    </form>
  );
};
