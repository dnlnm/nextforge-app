"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { DatePicker } from "@repo/design-system/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { transferStudentAction } from "../../enrollment/actions";
import type { EnrollableClass } from "./enroll-student-dialog";

export interface ActiveEnrollmentOption {
  readonly className: string;
  readonly id: string;
  readonly subjectName: string;
}

const parseMoney = (value: string): number | null => {
  const parsed = Number.parseFloat(value);

  return value.trim() === "" || Number.isNaN(parsed)
    ? null
    : Math.round(parsed * 100);
};

export const TransferStudentDialog = ({
  activeEnrollments,
  classes,
  onOpenChange,
  open,
}: {
  readonly activeEnrollments: ActiveEnrollmentOption[];
  readonly classes: EnrollableClass[];
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
}) => {
  const [sourceEnrollmentId, setSourceEnrollmentId] = useState("");
  const [destinationClassId, setDestinationClassId] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = () => {
    if (!sourceEnrollmentId) {
      toastManager.add({
        title: "Select the current enrollment to transfer.",
        type: "error",
      });
      return;
    }

    if (!destinationClassId) {
      toastManager.add({
        title: "Select the destination class.",
        type: "error",
      });
      return;
    }

    const formData = new FormData(formRef.current ?? undefined);
    const startsOn = (formData.get("startsOn") as string | null) || null;
    const customFee = parseMoney(
      (formData.get("destinationCustomFee") as string) ?? ""
    );

    startTransition(async () => {
      const result = await transferStudentAction({
        destinationClassId,
        destinationCustomFeeSen: customFee,
        sourceEnrollmentId,
        startsOn,
      });

      if (result.error) {
        toastManager.add({
          ...{
            description: result.error,
          },
          title: "Could not transfer student",
          type: "error",
        });
        return;
      }

      toastManager.add({
        ...{
          description: "The enrollment was moved to the destination class.",
        },
        title: "Student transferred",
        type: "success",
      });
      onOpenChange(false);
      setSourceEnrollmentId("");
      setDestinationClassId("");
      router.refresh();
    });
  };

  const hasActiveEnrollment = activeEnrollments.length > 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer class</DialogTitle>
          <DialogDescription>
            End the current enrollment and enroll the student into another class
            in one step.
          </DialogDescription>
        </DialogHeader>

        {hasActiveEnrollment ? (
          <form className="grid gap-4" ref={formRef}>
            <div className="grid gap-2">
              <Label htmlFor="source">Current class</Label>
              <Select
                name="sourceEnrollmentId"
                onValueChange={(value) => setSourceEnrollmentId(value ?? "")}
                value={sourceEnrollmentId}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select current class" />
                </SelectTrigger>
                <SelectContent>
                  {activeEnrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>
                      {enrollment.className} · {enrollment.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination">Destination class</Label>
              <Select
                name="destinationClassId"
                onValueChange={(value) => setDestinationClassId(value ?? "")}
                value={destinationClassId}
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select destination class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((learningClass) => (
                    <SelectItem key={learningClass.id} value={learningClass.id}>
                      {learningClass.name} · {learningClass.subjectName}
                      {learningClass.levelName
                        ? ` · ${learningClass.levelName}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transferStartsOn">Start date</Label>
              <DatePicker
                id="transferStartsOn"
                name="startsOn"
                placeholder="Today"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destinationCustomFee">
                Custom monthly fee (RM)
              </Label>
              <Input
                id="destinationCustomFee"
                inputMode="decimal"
                min="0"
                name="destinationCustomFee"
                placeholder="Keeps current fee"
                step="0.01"
                type="number"
              />
              <p className="text-muted-foreground text-xs">
                Leave blank to keep the custom fee from the current enrollment,
                or use the destination class default.
              </p>
            </div>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">
            This student has no active enrollment to transfer.
          </p>
        )}

        <DialogFooter>
          <Button
            disabled={isPending || !hasActiveEnrollment}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Transferring...
              </>
            ) : (
              "Transfer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
