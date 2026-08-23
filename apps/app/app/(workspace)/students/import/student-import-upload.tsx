"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { CardContent } from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { toastManager } from "@repo/design-system/components/ui/toast";
import {
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { validateStudentImport } from "./actions";
import { MAX_IMPORT_BYTES } from "./lib/workbook";

interface SignResponse {
  error?: string;
  importId?: string;
  uploadUrl?: string;
}

const MAX_LABEL = "10 MiB";
const ROW_LABEL = "5,000 rows";

export const StudentImportUpload = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [pending, setPending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
        title: `The workbook exceeds the ${MAX_LABEL} limit.`,
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

  const isXlsx = file?.name.toLowerCase().endsWith(".xlsx") ?? false;
  const underSize = file ? file.size <= MAX_IMPORT_BYTES : false;

  return (
    <CardShell>
      <CardContent className="grid gap-4 p-6">
        <button
          aria-label={
            file
              ? `Selected ${file.name}, click to change`
              : "Choose Excel workbook"
          }
          className={`grid min-h-48 place-items-center rounded-lg border p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-dashed bg-muted/20 hover:bg-muted/40"
          }`}
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            chooseFile(event.dataTransfer.files[0]);
          }}
          type="button"
        >
          <span className="grid justify-items-center gap-2">
            <span
              className={`grid size-10 place-items-center rounded-lg border ${
                file
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {file ? (
                <FileSpreadsheetIcon className="size-5" />
              ) : (
                <UploadCloudIcon className="size-5" />
              )}
            </span>
            <span className="max-w-[28ch] truncate font-medium text-sm">
              {file?.name ?? "Drop an Excel workbook here"}
            </span>
            <span className="text-muted-foreground text-xs">
              {file
                ? `${(file.size / 1024).toFixed(1)} KiB \u00B7 ${isXlsx ? ".xlsx" : "wrong type"}`
                : `.xlsx only \u00B7 up to ${MAX_LABEL} \u00B7 ${ROW_LABEL}`}
            </span>
            {!file && (
              <span className="text-muted-foreground text-xs">
                Click to browse · validation before import
              </span>
            )}
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={file ? (isXlsx ? "success" : "error") : "outline"}>
            .xlsx
          </Badge>
          <Badge variant={file ? (underSize ? "success" : "error") : "outline"}>
            ≤ {MAX_LABEL}
          </Badge>
          <Badge variant="outline">≤ {ROW_LABEL}</Badge>
          {file && (
            <Button
              className="ml-auto"
              disabled={pending}
              onClick={() => setFile(undefined)}
              size="sm"
              variant="ghost"
            >
              <XIcon className="size-4" />
              Remove
            </Button>
          )}
        </div>
        <div className="flex justify-end">
          <Button disabled={!file || pending} onClick={upload}>
            {pending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <UploadCloudIcon className="size-4" />
            )}
            {pending ? "Validating…" : "Upload and Review"}
          </Button>
        </div>
      </CardContent>
    </CardShell>
  );
};
