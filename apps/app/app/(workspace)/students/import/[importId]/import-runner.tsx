"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Progress } from "@repo/design-system/components/ui/progress";
import { Loader2Icon, PlayIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { executeStudentImportBatch, startStudentImport } from "../actions";

export const ImportRunner = ({
  importId,
  status,
  validRows,
  processedRows,
}: {
  importId: string;
  status: string;
  validRows: number;
  processedRows: number;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(status === "PROCESSING");
  const [batch, setBatch] = useState(0);
  // Each refreshed processed count schedules the next persisted batch.
  // biome-ignore lint/correctness/useExhaustiveDependencies: processedRows is the batch trigger
  useEffect(() => {
    if (!running) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      const result = await executeStudentImportBatch(importId);
      if (cancelled) {
        return;
      }
      if (result.error) {
        toast.error(result.error);
        setRunning(false);
        return;
      }
      router.refresh();
      if (result.complete) {
        setRunning(false);
        toast.success("Student import completed.");
      } else {
        setBatch((value) => value + 1);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [batch, importId, processedRows, router, running]);
  const start = () =>
    startTransition(async () => {
      const result = await startStudentImport(importId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRunning(true);
      router.refresh();
    });
  if (status === "READY") {
    return (
      <div className="grid gap-3">
        <Alert>
          <AlertTitle>Nothing has been imported yet</AlertTitle>
          <AlertDescription>
            Valid rows will create new students and guardians. Invalid and
            duplicate rows will be skipped.
          </AlertDescription>
        </Alert>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="justify-self-end"
              disabled={!validRows || pending}
            >
              {pending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              Import {validRows.toLocaleString()} Students
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Import {validRows.toLocaleString()} students?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This creates new student and guardian records. Invalid and
                duplicate rows remain skipped, and this import cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={start}>
                Confirm Import
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
  if (status === "PROCESSING") {
    const percent = validRows
      ? Math.round((processedRows / validRows) * 100)
      : 0;
    return (
      <div className="grid gap-2">
        <div className="flex justify-between text-sm">
          <span>Importing students...</span>
          <span className="tabular-nums">
            {processedRows.toLocaleString()} / {validRows.toLocaleString()}
          </span>
        </div>
        <Progress value={percent} />
        <p className="text-muted-foreground text-xs">
          Keep this page open. Progress is saved after every batch.
        </p>
      </div>
    );
  }
  return null;
};
