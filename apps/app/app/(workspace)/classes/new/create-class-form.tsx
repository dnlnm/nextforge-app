"use client";

import type { DayOfWeek } from "@repo/database";
import { formatWallClockTime } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { DatePicker } from "@repo/design-system/components/ui/date-picker";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  BookOpenIcon,
  CalendarRangeIcon,
  Clock3Icon,
  MapPinIcon,
  Settings2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { buildClassCode } from "@/lib/codes";
import { createClass } from "../actions";
import {
  ScheduleBuilder,
  type ScheduleEntry,
} from "../components/schedule-builder";

interface CreateClassFormProps {
  readonly academicYearOptions: string[];
  readonly levels: Array<{
    readonly code: string;
    readonly id: string;
    readonly name: string;
  }>;
  readonly rooms: Array<{
    readonly capacity: number | null;
    readonly id: string;
    readonly name: string;
  }>;
  readonly subjects: Array<{
    readonly code: string;
    readonly id: string;
    readonly name: string;
  }>;
  readonly teachers: Array<{
    readonly fullName: string;
    readonly id: string;
  }>;
}

const dayLabels: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const timeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const hours = Number.parseInt(hour, 10);
  const minutes = Number.parseInt(minute, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatTime = (time: string) => {
  const minutes = timeToMinutes(time);

  if (minutes === null) {
    return time;
  }

  return formatWallClockTime(time);
};

const newScheduleId = () => crypto.randomUUID();

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving..." : "Save Class"}
    </Button>
  );
};

const validate = (
  formData: FormData,
  schedules: ScheduleEntry[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const getValue = (key: string) => {
    const value = formData.get(key);

    return typeof value === "string" ? value.trim() : "";
  };

  if (!getValue("name")) {
    errors.name = "Class name is required.";
  }

  if (!getValue("subjectId")) {
    errors.subjectId = "Subject is required.";
  }

  if (!getValue("levelId")) {
    errors.levelId = "Level is required.";
  }

  if (!getValue("code")) {
    errors.code = "Class code is required.";
  }

  if (!getValue("academicYear")) {
    errors.academicYear = "Academic year is required.";
  }

  if (!getValue("teacherId")) {
    errors.teacherId = "Teacher is required.";
  }

  if (!getValue("startDate")) {
    errors.startDate = "Start date is required.";
  }

  const endDate = getValue("endDate");

  if (endDate && endDate < getValue("startDate")) {
    errors.endDate = "End date must be after the start date.";
  }

  if (schedules.length === 0) {
    errors.schedules = "At least one schedule is required.";
  }

  const seenDays = new Set<string>();

  schedules.forEach((schedule, index) => {
    if (!schedule.dayOfWeek) {
      errors[`schedule_${index}_day`] = "Day is required.";
    } else if (seenDays.has(schedule.dayOfWeek)) {
      errors[`schedule_${index}_day`] = "Duplicate day.";
    } else {
      seenDays.add(schedule.dayOfWeek);
    }

    if (!schedule.startsAt) {
      errors[`schedule_${index}_start`] = "Start time is required.";
    }

    if (!schedule.endsAt) {
      errors[`schedule_${index}_end`] = "End time is required.";
    }

    if (!schedule.roomId) {
      errors[`schedule_${index}_room`] = "Room is required.";
    }

    if (schedule.startsAt && schedule.endsAt) {
      const start = timeToMinutes(schedule.startsAt);
      const end = timeToMinutes(schedule.endsAt);

      if (start !== null && end !== null && end <= start) {
        errors[`schedule_${index}_time`] =
          "End time must be after the start time.";
      }
    }
  });

  return errors;
};

export const CreateClassForm = ({
  academicYearOptions,
  levels,
  rooms,
  subjects,
  teachers,
}: CreateClassFormProps) => {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [academicYear, setAcademicYear] = useState(
    academicYearOptions.at(0) ?? ""
  );
  const [capacity, setCapacity] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([
    {
      dayOfWeek: "" as DayOfWeek,
      endsAt: "",
      id: newScheduleId(),
      roomId: "",
      startsAt: "",
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const selectedTeacher = teachers.find((teacher) => teacher.id === teacherId);
  const selectedLevel = levels.find((level) => level.id === levelId);

  const autoClassCode = buildClassCode({
    academicYear,
    levelCode: selectedLevel?.code,
    subjectCode: selectedSubject?.code,
  });
  const [classCode, setClassCode] = useState(autoClassCode);

  useEffect(() => {
    setClassCode(autoClassCode);
  }, [autoClassCode]);

  const selectedTags = useMemo(
    () =>
      [selectedLevel?.name, selectedSubject?.name].filter(Boolean) as string[],
    [selectedLevel, selectedSubject]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const validationErrors = validate(formData, schedules);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
    }
  };

  const errorClassName = (hasError: boolean) =>
    hasError ? "border-destructive focus-visible:ring-destructive/50" : "";

  return (
    <>
      <section className="grid content-start gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="size-5" />
              Class Information
            </CardTitle>
            <CardDescription>
              Create the core class details first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createClass}
              className="grid gap-4"
              onSubmit={handleSubmit}
            >
              <input name="academicYear" type="hidden" value={academicYear} />
              <input name="capacity" type="hidden" value={capacity} />
              <input name="levelId" type="hidden" value={levelId} />
              <input name="monthlyFee" type="hidden" value={monthlyFee} />
              <input name="teacherId" type="hidden" value={teacherId} />
              {schedules.map((schedule, index) => (
                <div className="contents" key={schedule.id}>
                  <input
                    name={`schedules[${index}].dayOfWeek`}
                    type="hidden"
                    value={schedule.dayOfWeek}
                  />
                  <input
                    name={`schedules[${index}].endsAt`}
                    type="hidden"
                    value={schedule.endsAt}
                  />
                  <input
                    name={`schedules[${index}].roomId`}
                    type="hidden"
                    value={schedule.roomId}
                  />
                  <input
                    name={`schedules[${index}].startsAt`}
                    type="hidden"
                    value={schedule.startsAt}
                  />
                </div>
              ))}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2 md:col-span-1">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    aria-invalid={Boolean(errors.name)}
                    autoComplete="organization"
                    className={errorClassName(Boolean(errors.name))}
                    id="name"
                    name="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. SPM Physics (2025)"
                    value={name}
                  />
                  {errors.name ? (
                    <p className="text-destructive text-xs">{errors.name}</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subjectId">Subject *</Label>
                  <input name="subjectId" type="hidden" value={subjectId} />
                  <Select
                    onValueChange={(value) => setSubjectId(value ?? "")}
                    value={subjectId}
                  >
                    <SelectTrigger
                      className={errorClassName(Boolean(errors.subjectId))}
                      id="subjectId"
                    >
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subjectId ? (
                    <p className="text-destructive text-xs">
                      {errors.subjectId}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    onValueChange={(value) => setLevelId(value ?? "")}
                    value={levelId}
                  >
                    <SelectTrigger
                      className={errorClassName(Boolean(errors.levelId))}
                      id="level"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.levelId ? (
                    <p className="text-destructive text-xs">{errors.levelId}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="code">Class Code *</Label>
                  <Input
                    aria-invalid={Boolean(errors.code)}
                    className={errorClassName(Boolean(errors.code))}
                    id="code"
                    name="code"
                    onChange={(event) => setClassCode(event.target.value)}
                    placeholder="e.g. PHY-SPM-26"
                    value={classCode}
                  />
                  {errors.code ? (
                    <p className="text-destructive text-xs">{errors.code}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    Auto-generated from subject, level, and year. Editable if
                    needed.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Select
                    onValueChange={(value) => setAcademicYear(value ?? "")}
                    value={academicYear}
                  >
                    <SelectTrigger id="academicYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <DatePicker
                    className={errorClassName(Boolean(errors.startDate))}
                    id="startDate"
                    name="startDate"
                    placeholder="Select start date"
                  />
                  {errors.startDate ? (
                    <p className="text-destructive text-xs">
                      {errors.startDate}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <DatePicker
                    className={errorClassName(Boolean(errors.endDate))}
                    id="endDate"
                    name="endDate"
                    placeholder="Select end date"
                  />
                  {errors.endDate ? (
                    <p className="text-destructive text-xs">{errors.endDate}</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Maximum Students</Label>
                  <Input
                    id="capacity"
                    min="1"
                    onChange={(event) => setCapacity(event.target.value)}
                    placeholder="e.g. 25"
                    type="number"
                    value={capacity}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monthlyFee">Class Fee (RM)</Label>
                  <Input
                    id="monthlyFee"
                    min="0"
                    onChange={(event) => setMonthlyFee(event.target.value)}
                    placeholder="e.g. 200.00"
                    step="0.01"
                    type="number"
                    value={monthlyFee}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter class description, focus areas, or notes..."
                />
              </div>

              <fieldset className="grid gap-3">
                <legend className="font-medium text-sm">
                  Schedule <span className="text-destructive">*</span>
                </legend>
                <ScheduleBuilder
                  classCapacity={Number.parseInt(capacity, 10) || 0}
                  errors={errors}
                  onSchedulesChange={setSchedules}
                  rooms={rooms}
                  schedules={schedules}
                />
                {errors.schedules ? (
                  <p className="text-destructive text-xs">{errors.schedules}</p>
                ) : null}
              </fieldset>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2Icon className="size-5" />
                    Class Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks (optional)</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      placeholder="Any additional notes for this class..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" render={<a href="/classes" />}>
                  Cancel
                </Button>
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Class Preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                <BookOpenIcon className="size-10" />
              </div>
              <div className="grid gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Class Name</p>
                  <p className="font-semibold text-lg">{name || "Untitled"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      className="rounded-md bg-primary/10 px-2 py-1 text-primary text-xs"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Class Code</p>
                  <p className="font-medium">{classCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Academic Year</p>
                  <p className="font-medium">{academicYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Teacher</p>
                  <p className="font-medium">
                    {selectedTeacher?.fullName ?? "Select teacher"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRangeIcon className="size-5" />
              Schedule Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {schedules.length === 0 ? (
              <p className="text-muted-foreground">No schedules added yet.</p>
            ) : (
              schedules.map((schedule, index) => {
                const room = rooms.find((item) => item.id === schedule.roomId);

                return (
                  <div
                    className="grid gap-1.5 border-b pb-3 last:border-b-0"
                    key={schedule.id}
                  >
                    <p className="font-medium">
                      {schedule.dayOfWeek
                        ? (dayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek)
                        : `Schedule ${index + 1}`}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock3Icon className="size-3.5" />
                      <span>
                        {schedule.startsAt && schedule.endsAt
                          ? `${formatTime(schedule.startsAt)} - ${formatTime(schedule.endsAt)}`
                          : "Select time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPinIcon className="size-3.5" />
                      <span>{room?.name ?? "Select room"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Teacher</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="teacherId">Main Teacher *</Label>
              <Select
                onValueChange={(value) => setTeacherId(value ?? "")}
                value={teacherId}
              >
                <SelectTrigger
                  className={errorClassName(Boolean(errors.teacherId))}
                  id="teacherId"
                >
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacherId ? (
                <p className="text-destructive text-xs">{errors.teacherId}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </>
  );
};
