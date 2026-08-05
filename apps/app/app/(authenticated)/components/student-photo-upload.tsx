"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { CloudUploadIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { StudentAvatar } from "./student-avatar";

const maxPhotoSizeBytes = 2 * 1024 * 1024;

export const StudentPhotoUpload = ({
  className,
  defaultValue,
  gender,
  name,
}: {
  className?: string;
  defaultValue?: string;
  gender?: string | null;
  name: string;
}) => {
  const [photoUrl, setPhotoUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/uploads/student-photo", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        url?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Upload failed");
      }

      setPhotoUrl(result.url ?? "");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed";

      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const getAction = () => {
    if (isUploading) {
      return {
        icon: <Loader2Icon className="size-4 animate-spin" />,
        label: "Uploading...",
      };
    }

    if (photoUrl) {
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
          photoUrl={photoUrl || null}
        />
        {photoUrl ? (
          <Button
            className="absolute -right-1 -bottom-1 size-7 rounded-full"
            onClick={() => setPhotoUrl("")}
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
          {photoUrl ? "Student photo uploaded" : "Upload student photo"}
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
      <input name={name} type="hidden" value={photoUrl} />
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
