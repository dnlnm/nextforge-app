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
import { enrollStudentAction } from "../../enrollment/actions";

export interface EnrollableClass {
  readonly capacity: number | null;
  readonly id: string;
  readonly levelName: string | null;
  readonly monthlyFeeSen: number;
  readonly name: string;
  readonly scheduleLabel: string;
  readonly subjectName: string;
  readonly teacherName: string | null;
}

const parseMoney = (value: string): number | null => {
  const parsed = Number.parseFloat(value);

  return value.trim() === "" || Number.isNaN(parsed)
    ? null
    : Math.round(parsed * 100);
};

export const EnrollStudentDialog = ({
  classes,
  onOpenChange,
  open,
  studentId,
}: {
  readonly classes: EnrollableClass[];
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly studentId: string;
}) => {
  const [classId, setClassId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const selectedClass = classes.find((c) => c.id === classId);

  const handleSubmit = () => {
    if (!classId) {
      toastManager.add({
        title: "Select a class to enroll the student into.",
        type: "error",
      });
      return;
    }

    const formData = new FormData(formRef.current ?? undefined);
    const startsOn = (formData.get("startsOn") as string | null) || null;
    const customFee = parseMoney((formData.get("customFee") as string) ?? "");

    startTransition(async () => {
      const result = await enrollStudentAction({
        classId,
        customFeeSen: customFee,
        startsOn,
        studentId,
      });

      if (result.error) {
        toastManager.add({
          ...{ description: result.error },
          title: "Could not enroll student",
          type: "error",
        });
        return;
      }

      toastManager.add({
        ...{
          description: selectedClass
            ? `Enrolled into ${selectedClass.name}.`
            : undefined,
        },
        title: "Student enrolled",
        type: "success",
      });
      onOpenChange(false);
      setClassId("");
      router.refresh();
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll into class</DialogTitle>
          <DialogDescription>
            Select an active class and configure the start date and optional
            custom fee.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" ref={formRef}>
          <div className="grid gap-2">
            <Label htmlFor="class">Class</Label>
            <Select
              name="classId"
              onValueChange={(value) => setClassId(value ?? "")}
              value={classId}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Select a class" />
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

          {selectedClass ? (
            <div className="grid gap-2 border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Teacher</span>
                <span>{selectedClass.teacherName ?? "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span>{selectedClass.scheduleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly fee</span>
                <span>RM {(selectedClass.monthlyFeeSen / 100).toFixed(2)}</span>
              </div>
              {selectedClass.capacity !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span>{selectedClass.capacity} seats</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="startsOn">Start date</Label>
            <DatePicker id="startsOn" name="startsOn" placeholder="Today" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customFee">Custom monthly fee (RM)</Label>
            <Input
              id="customFee"
              inputMode="decimal"
              min="0"
              name="customFee"
              placeholder="Uses class default"
              step="0.01"
              type="number"
            />
          </div>
        </form>

        <DialogFooter>
          <Button disabled={isPending} onClick={handleSubmit} type="button">
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Enrolling...
              </>
            ) : (
              "Enroll"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
