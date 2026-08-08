"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { privateFileUrl, uploadToR2 } from "@repo/storage/client";
import { CloudUploadIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StudentAvatar } from "./student-avatar";

const maxPhotoSizeBytes = 2 * 1024 * 1024;

export const StudentPhotoUpload = ({
  className,
  defaultValue,
  formId,
  gender,
  name,
}: {
  className?: string;
  defaultValue?: string;
  // Associates the hidden input with a <form id> rendered elsewhere (e.g. when
  // this component sits outside the <form> element, like the edit-page sidebar).
  formId?: string;
  gender?: string | null;
  name: string;
}) => {
  // `photoKey` is the R2 object key persisted in the hidden form input.
  const [photoKey, setPhotoKey] = useState(defaultValue ?? "");
  // `preview` is a local object URL for the just-selected file (instant
  // preview without a round-trip), falling back to the proxy for stored keys.
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview]
  );

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Photo must be an image.");
      return;
    }

    if (file.size > maxPhotoSizeBytes) {
      setError("Photo must be 2MB or smaller.");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Show an immediate local preview while the upload completes.
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const { key } = await uploadToR2(file, "/api/uploads/student-photo");
      setPhotoKey(key);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed";

      setError(message);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clear = () => {
    setPhotoKey("");
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
  };

  // Prefer the local preview; otherwise render the stored key via the proxy.
  const displaySrc = preview ?? privateFileUrl(photoKey);
  const hasPhoto = Boolean(photoKey || preview);

  const getAction = () => {
    if (isUploading) {
      return {
        icon: <Loader2Icon className="size-4 animate-spin" />,
        label: "Uploading...",
      };
    }

    if (hasPhoto) {
      return { icon: <ImageIcon className="size-4" />, label: "Change" };
    }

    return {
      icon: <CloudUploadIcon className="size-4" />,
      label: "Choose File",
    };
  };

  const action = getAction();

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <StudentAvatar
          className="size-24"
          gender={gender}
          name="Student photo"
          photoUrl={displaySrc}
        />
        {hasPhoto ? (
          <Button
            className="absolute -right-1 -bottom-1 size-7 rounded-full"
            onClick={clear}
            size="icon"
            type="button"
            variant="outline"
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <div className="text-center">
        <p className="font-medium text-sm">
          {hasPhoto ? "Student photo uploaded" : "Upload student photo"}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          JPG, PNG or up to 2MB
        </p>
      </div>
      <input
        accept="image/*"
        className="hidden"
        name={`${name}-file`}
        onChange={(event) => handleFileChange(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <input form={formId} name={name} type="hidden" value={photoKey} />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {action.icon}
          {action.label}
        </Button>
      </div>
    </div>
  );
};
