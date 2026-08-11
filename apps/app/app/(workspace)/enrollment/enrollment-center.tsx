"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bulkEnrollStudentsAction,
  endEnrollmentAction,
  enrollStudentAction,
  transferStudentAction,
} from "./actions";

export interface EnrollmentCenterClass {
  readonly capacity: number | null;
  readonly code: string;
  readonly id: string;
  readonly levelName: string | null;
  readonly monthlyFeeSen: number;
  readonly name: string;
  readonly scheduleLabel: string;
  readonly subjectName: string;
  readonly teacherName: string | null;
}

export interface EnrollmentCenterStudent {
  readonly code: string;
  readonly fullName: string;
  readonly id: string;
  readonly levelName: string | null;
}

export interface EnrollmentCenterEnrollment {
  readonly className: string;
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly subjectName: string;
}

interface EnrollmentCenterProps {
  readonly classes: EnrollmentCenterClass[];
  readonly enrollments: EnrollmentCenterEnrollment[];
  readonly students: EnrollmentCenterStudent[];
}

const parseMoney = (value: string): number | null => {
  const parsed = Number.parseFloat(value);

  return value.trim() === "" || Number.isNaN(parsed)
    ? null
    : Math.round(parsed * 100);
};

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const useFilteredStudents = (students: EnrollmentCenterStudent[]) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return students;
    }

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(normalized) ||
        student.code.toLowerCase().includes(normalized)
    );
  }, [query, students]);

  return { filtered, query, setQuery };
};

export const EnrollmentCenter = ({
  classes,
  enrollments,
  students,
}: EnrollmentCenterProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const enrollSearch = useFilteredStudents(students);
  const bulkSearch = useFilteredStudents(students);

  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrollCustomFee, setEnrollCustomFee] = useState("");

  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const [transferEnrollmentId, setTransferEnrollmentId] = useState("");
  const [transferClassId, setTransferClassId] = useState("");
  const [transferCustomFee, setTransferCustomFee] = useState("");

  const [endEnrollmentId, setEndEnrollmentId] = useState("");

  const refresh = () => router.refresh();

  const handleEnroll = () => {
    if (!enrollStudentId) {
      toast.error("Select a student.");
      return;
    }
    if (!enrollClassId) {
      toast.error("Select a class.");
      return;
    }

    startTransition(async () => {
      const result = await enrollStudentAction({
        classId: enrollClassId,
        customFeeSen: parseMoney(enrollCustomFee),
        studentId: enrollStudentId,
      });

      if (result.error) {
        toast.error("Could not enroll student", { description: result.error });
        return;
      }

      toast.success("Student enrolled");
      setEnrollStudentId("");
      setEnrollClassId("");
      setEnrollCustomFee("");
      refresh();
    });
  };

  const toggleBulk = (studentId: string) => {
    setBulkSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const handleBulk = () => {
    if (!bulkClassId) {
      toast.error("Select a class.");
      return;
    }
    if (bulkSelectedIds.length === 0) {
      toast.error("Select at least one student.");
      return;
    }

    startTransition(async () => {
      const result = await bulkEnrollStudentsAction({
        classId: bulkClassId,
        studentIds: bulkSelectedIds,
      });

      toast.success("Bulk enrollment complete", {
        description: `${result.enrolledCount} enrolled, ${result.skippedCount} skipped, ${result.failed.length} failed.`,
      });
      setBulkSelectedIds([]);
      refresh();
    });
  };

  const handleTransfer = () => {
    if (!transferEnrollmentId) {
      toast.error("Select the current enrollment.");
      return;
    }
    if (!transferClassId) {
      toast.error("Select the destination class.");
      return;
    }

    startTransition(async () => {
      const result = await transferStudentAction({
        destinationClassId: transferClassId,
        destinationCustomFeeSen: parseMoney(transferCustomFee),
        sourceEnrollmentId: transferEnrollmentId,
      });

      if (result.error) {
        toast.error("Could not transfer student", {
          description: result.error,
        });
        return;
      }

      toast.success("Student transferred");
      setTransferEnrollmentId("");
      setTransferClassId("");
      setTransferCustomFee("");
      refresh();
    });
  };

  const handleEnd = () => {
    if (!endEnrollmentId) {
      toast.error("Select an enrollment to end.");
      return;
    }

    startTransition(async () => {
      const result = await endEnrollmentAction({
        enrollmentId: endEnrollmentId,
      });

      if (result.error) {
        toast.error("Could not end enrollment", { description: result.error });
        return;
      }

      toast.success("Enrollment ended");
      setEndEnrollmentId("");
      refresh();
    });
  };

  const selectedEnrollClass = classes.find((c) => c.id === enrollClassId);

  return (
    <Tabs className="gap-4" defaultValue="enroll">
      <TabsList className="grid h-auto w-full grid-cols-4">
        <TabsTrigger value="enroll">Enroll</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
        <TabsTrigger value="transfer">Transfer</TabsTrigger>
        <TabsTrigger value="end">End</TabsTrigger>
      </TabsList>

      <TabsContent value="enroll">
        <Card>
          <CardHeader>
            <CardTitle>Enroll a student</CardTitle>
            <CardDescription>
              Select a student and a class, review the summary, then confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-4">
              <StudentSearch
                filter={enrollSearch}
                label="Student"
                onSelect={setEnrollStudentId}
                selectedId={enrollStudentId}
                students={students}
              />
              <div className="grid gap-2">
                <Label htmlFor="enroll-class">Class</Label>
                <Select onValueChange={setEnrollClassId} value={enrollClassId}>
                  <SelectTrigger id="enroll-class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((learningClass) => (
                      <SelectItem
                        key={learningClass.id}
                        value={learningClass.id}
                      >
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
                <Label htmlFor="enroll-fee">Custom monthly fee (RM)</Label>
                <Input
                  id="enroll-fee"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setEnrollCustomFee(event.target.value)}
                  placeholder="Uses class default"
                  step="0.01"
                  type="number"
                  value={enrollCustomFee}
                />
              </div>
            </div>

            <div className="grid content-start gap-4">
              {selectedEnrollClass ? (
                <ClassSummaryCard learningClass={selectedEnrollClass} />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="grid gap-1 p-4 text-muted-foreground text-sm">
                    <p>Select a student and class to preview enrollment.</p>
                  </CardContent>
                </Card>
              )}
              <Button
                className="md:justify-self-end"
                disabled={isPending}
                onClick={handleEnroll}
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Confirm enrollment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bulk">
        <Card>
          <CardHeader>
            <CardTitle>Bulk add students</CardTitle>
            <CardDescription>
              Select a class, then choose multiple students to enroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 md:max-w-md">
              <Label htmlFor="bulk-class">Class</Label>
              <Select onValueChange={setBulkClassId} value={bulkClassId}>
                <SelectTrigger id="bulk-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((learningClass) => (
                    <SelectItem key={learningClass.id} value={learningClass.id}>
                      {learningClass.name} · {learningClass.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <StudentSearch
                filter={bulkSearch}
                label="Filter students"
                onSelect={() => undefined}
                selectedId={null}
                students={students}
              />
              <div className="grid max-h-80 gap-2 overflow-y-auto">
                {bulkSearch.filtered.map((student) => {
                  const isSelected = bulkSelectedIds.includes(student.id);

                  return (
                    <button
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      key={student.id}
                      onClick={() => toggleBulk(student.id)}
                      type="button"
                    >
                      <span>
                        {student.fullName}
                        <span className="text-muted-foreground">
                          {" "}
                          · {student.code}
                        </span>
                      </span>
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {isSelected ? "Selected" : "Add"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <Button
                className="justify-self-start"
                disabled={isPending || bulkSelectedIds.length === 0}
                onClick={handleBulk}
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  `Enroll ${bulkSelectedIds.length} selected`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transfer">
        <Card>
          <CardHeader>
            <CardTitle>Transfer a student</CardTitle>
            <CardDescription>
              Move a student between classes in one step.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-4">
              <div className="grid gap-2">
                <Label htmlFor="transfer-enrollment">Current enrollment</Label>
                <Select
                  onValueChange={setTransferEnrollmentId}
                  value={transferEnrollmentId}
                >
                  <SelectTrigger id="transfer-enrollment">
                    <SelectValue placeholder="Select student + class" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => (
                      <SelectItem key={enrollment.id} value={enrollment.id}>
                        {enrollment.studentName} · {enrollment.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {enrollments.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No active enrollments to transfer.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transfer-class">Destination class</Label>
                <Select
                  onValueChange={setTransferClassId}
                  value={transferClassId}
                >
                  <SelectTrigger id="transfer-class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((learningClass) => (
                      <SelectItem
                        key={learningClass.id}
                        value={learningClass.id}
                      >
                        {learningClass.name} · {learningClass.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transfer-fee">Custom monthly fee (RM)</Label>
                <Input
                  id="transfer-fee"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setTransferCustomFee(event.target.value)}
                  placeholder="Keeps current fee"
                  step="0.01"
                  type="number"
                  value={transferCustomFee}
                />
              </div>
            </div>
            <div className="grid content-start gap-4">
              <p className="text-muted-foreground text-sm">
                The current enrollment ends and a new enrollment starts in the
                destination class. Any custom fee carries over unless you enter
                a new one.
              </p>
              <Button
                className="md:justify-self-end"
                disabled={isPending}
                onClick={handleTransfer}
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Confirm transfer"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="end">
        <Card>
          <CardHeader>
            <CardTitle>End an enrollment</CardTitle>
            <CardDescription>
              End a student&apos;s active enrollment in a class.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 md:max-w-md">
              <Label htmlFor="end-enrollment">Enrollment</Label>
              <Select
                onValueChange={setEndEnrollmentId}
                value={endEnrollmentId}
              >
                <SelectTrigger id="end-enrollment">
                  <SelectValue placeholder="Select student + class" />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>
                      {enrollment.studentName} · {enrollment.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No active enrollments to end.
                </p>
              ) : null}
            </div>
            <Button
              className="justify-self-start"
              disabled={isPending || !endEnrollmentId}
              onClick={handleEnd}
              variant="outline"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Ending...
                </>
              ) : (
                "End enrollment"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

const StudentSearch = ({
  filter,
  label,
  onSelect,
  selectedId,
  students,
}: {
  readonly filter: ReturnType<typeof useFilteredStudents>;
  readonly label: string;
  readonly onSelect: (studentId: string) => void;
  readonly selectedId: string | null;
  readonly students: EnrollmentCenterStudent[];
}) => {
  const selectedStudent = students.find((student) => student.id === selectedId);

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => filter.setQuery(event.target.value)}
          placeholder="Search by name or code..."
          value={filter.query}
        />
      </div>
      <div className="grid max-h-56 gap-1 overflow-y-auto">
        {filter.filtered.length === 0 ? (
          <p className="py-2 text-muted-foreground text-sm">
            No students match.
          </p>
        ) : (
          filter.filtered.map((student) => (
            <button
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              key={student.id}
              onClick={() => onSelect(student.id)}
              type="button"
            >
              <span>{student.fullName}</span>
              <Badge
                variant={student.id === selectedId ? "default" : "outline"}
              >
                {student.code}
              </Badge>
            </button>
          ))
        )}
      </div>
      {selectedStudent ? (
        <p className="text-muted-foreground text-xs">
          Selected: {selectedStudent.fullName} (
          {selectedStudent.levelName ?? "No level"})
        </p>
      ) : null}
    </div>
  );
};

const ClassSummaryCard = ({
  learningClass,
}: {
  readonly learningClass: EnrollmentCenterClass;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{learningClass.name}</CardTitle>
      <CardDescription>
        {learningClass.subjectName}
        {learningClass.levelName ? ` · ${learningClass.levelName}` : ""}
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Code</span>
        <span>{learningClass.code}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Teacher</span>
        <span>{learningClass.teacherName ?? "Unassigned"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Schedule</span>
        <span className="text-right">{learningClass.scheduleLabel}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Monthly fee</span>
        <span>{formatMoney(learningClass.monthlyFeeSen)}</span>
      </div>
      {learningClass.capacity !== null ? (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Capacity</span>
          <span>{learningClass.capacity} seats</span>
        </div>
      ) : null}
    </CardContent>
  </Card>
);
