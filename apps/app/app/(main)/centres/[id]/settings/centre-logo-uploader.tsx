"use client";

import { Button } from "@repo/design-system/components/ui/fluid-button";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { optimizeImageFile, uploadToR2 } from "@repo/storage/client";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface CentreLogoUploaderProps {
  readonly centreName: string;
  readonly currentImageUrl: string | null;
  readonly disabled?: boolean;
  readonly onImageChange: (url: string | null) => void;
}

export const CentreLogoUploader = ({
  centreName,
  currentImageUrl,
  disabled = false,
  onImageChange,
}: CentreLogoUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file fires change
    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      toastManager.add({
        title: "Please select an image file (PNG, JPG, or WebP).",
        type: "error",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastManager.add({
        title: "File size exceeds 5MB limit.",
        type: "error",
      });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);

    try {
      // Optimize image in browser before R2 upload
      const optimized = await optimizeImageFile(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 512,
      });

      const { url } = await uploadToR2(optimized, "/api/uploads/centre-logo");
      if (!url) {
        throw new Error("Failed to obtain public logo URL.");
      }

      onImageChange(url);
      toastManager.add({
        title: "Logo uploaded successfully",
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        title: error instanceof Error ? error.message : "Failed to upload logo",
        type: "error",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageChange(null);
  };

  const displayImage = previewUrl ?? currentImageUrl;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <input
        accept="image/png,image/jpeg,image/webp"
        aria-label="Upload centre logo"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {/* Avatar display */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-1 shadow-2xs">
        {displayImage ? (
          <Image
            alt={`${centreName} logo`}
            className="size-full object-cover"
            height={80}
            src={displayImage}
            unoptimized
            width={80}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-primary/10 font-bold text-2xl text-primary">
            {centreName[0]?.toUpperCase() ?? "C"}
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
            <Loader2Icon className="size-6 animate-spin text-primary" />
          </div>
        ) : null}
      </div>

      {/* Action controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={disabled || uploading}
            onClick={() => fileInputRef.current?.click()}
            size="compact"
            type="button"
            variant="secondary"
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="size-3.5" />
                {displayImage ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </Button>

          {displayImage ? (
            <Button
              disabled={disabled || uploading}
              onClick={handleRemove}
              size="compact"
              type="button"
              variant="ghost"
            >
              <Trash2Icon className="size-3.5 text-destructive" />
              <span className="text-destructive">Remove</span>
            </Button>
          ) : null}
        </div>

        <p className="text-muted-foreground text-xs">
          Recommended square image (512×512px). PNG, JPG, or WebP up to 5MB.
        </p>
      </div>
    </div>
  );
};
