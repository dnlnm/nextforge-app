"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Loader2Icon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bulkEnrollStudentsAction,
  enrollStudentAction,
} from "../../enrollment/actions";

export interface AvailableStudent {
  readonly code: string;
  readonly fullName: string;
  readonly id: string;
}

export const ClassEnrollmentActions = ({
  classId,
  students,
}: {
  readonly classId: string;
  readonly students: AvailableStudent[];
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [students]
  );

  const toggleStudent = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const handleSingleAdd = () => {
    if (!selectedStudentId) {
      toast.error("Select a student to enroll.");
      return;
    }

    startTransition(async () => {
      const result = await enrollStudentAction({
        classId,
        studentId: selectedStudentId,
      });

      if (result.error) {
        toast.error("Could not enroll student", { description: result.error });
        return;
      }

      toast.success("Student enrolled");
      setIsAddOpen(false);
      setSelectedStudentId("");
      router.refresh();
    });
  };

  const handleBulkAdd = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one student.");
      return;
    }

    startTransition(async () => {
      const result = await bulkEnrollStudentsAction({
        classId,
        studentIds: selectedIds,
      });

      toast.success("Bulk enrollment complete", {
        description: `${result.enrolledCount} enrolled, ${result.skippedCount} skipped, ${result.failed.length} failed.`,
      });
      setIsBulkOpen(false);
      setSelectedIds([]);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setIsAddOpen(true)}>
          <UserPlusIcon className="size-4" />
          Add Student
        </Button>
        <Button onClick={() => setIsBulkOpen(true)} variant="outline">
          <UsersRoundIcon className="size-4" />
          Bulk Add
        </Button>
      </div>

      <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              Enroll an active student into this class.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="student">Student</Label>
              <Select
                onValueChange={setSelectedStudentId}
                value={selectedStudentId}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} · {student.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sortedStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                All active students are already enrolled in this class.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              disabled={isPending || sortedStudents.length === 0}
              onClick={handleSingleAdd}
              type="button"
            >
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

      <Dialog onOpenChange={setIsBulkOpen} open={isBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk add students</DialogTitle>
            <DialogDescription>
              Select multiple active students to enroll into this class.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-80 gap-2 overflow-y-auto">
            {sortedStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                All active students are already enrolled in this class.
              </p>
            ) : (
              sortedStudents.map((student) => {
                const isSelected = selectedIds.includes(student.id);

                return (
                  <button
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    type="button"
                  >
                    <span>{student.fullName}</span>
                    <Badge variant={isSelected ? "default" : "outline"}>
                      {student.code}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={isPending || selectedIds.length === 0}
              onClick={handleBulkAdd}
              type="button"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Enrolling...
                </>
              ) : (
                `Enroll ${selectedIds.length} selected`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
