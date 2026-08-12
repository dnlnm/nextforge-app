"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { validateStudentImport } from "./actions";
import { MAX_IMPORT_BYTES } from "./lib/workbook";

interface SignResponse {
  error?: string;
  importId?: string;
  uploadUrl?: string;
}

export const StudentImportUpload = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [pending, setPending] = useState(false);
  const chooseFile = (selected?: File) => {
    if (!selected) {
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      toastManager.add({ title: "Select an .xlsx workbook.", type: "error" });
      return;
    }
    if (selected.size > MAX_IMPORT_BYTES) {
      toastManager.add({
        title: "The workbook exceeds the 10 MiB limit.",
        type: "error",
      });
      return;
    }
    setFile(selected);
  };
  const upload = async () => {
    if (!file) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/uploads/student-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      });
      const signed = (await response.json()) as SignResponse;
      if (!(response.ok && signed.uploadUrl && signed.importId)) {
        throw new Error(signed.error ?? "Unable to prepare upload.");
      }
      const put = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: file,
      });
      if (!put.ok) {
        throw new Error("The workbook could not be uploaded.");
      }
      const result = await validateStudentImport(signed.importId);
      if (result.error) {
        throw new Error(result.error);
      }
      toastManager.add({ title: "Workbook validated.", type: "success" });
      router.push(`/students/import/${signed.importId}`);
      router.refresh();
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error
            ? error.message
            : "The import could not be prepared.",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  };
  return (
    <Card>
      <CardContent className="grid gap-4 p-6">
        <button
          className="grid min-h-48 place-items-center rounded-lg border border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0]);
          }}
          type="button"
        >
          <span className="grid justify-items-center gap-2">
            {file ? (
              <FileSpreadsheetIcon className="size-10 text-primary" />
            ) : (
              <UploadCloudIcon className="size-10 text-muted-foreground" />
            )}
            <span className="font-medium">
              {file?.name ?? "Drop an Excel workbook here"}
            </span>
            <span className="text-muted-foreground text-sm">
              {file
                ? `${(file.size / 1024).toFixed(1)} KiB`
                : ".xlsx only, up to 10 MiB and 5,000 data rows"}
            </span>
          </span>
        </button>
        <input
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={pending}
          onChange={(event) => chooseFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
        <div className="flex justify-end gap-2">
          {file && (
            <Button
              disabled={pending}
              onClick={() => setFile(undefined)}
              variant="outline"
            >
              Remove
            </Button>
          )}
          <Button disabled={!file || pending} onClick={upload}>
            {pending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <UploadCloudIcon className="size-4" />
            )}
            {pending ? "Uploading and validating..." : "Upload and Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
