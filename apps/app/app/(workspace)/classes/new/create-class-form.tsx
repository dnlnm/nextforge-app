"use client";

import { formatWallClockTime } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { Group, GroupSeparator, GroupText } from "@repo/design-system/components/ui/group";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarRangeIcon,
  CheckIcon,
  ChevronDownIcon,
  Clock3Icon,
  InfoIcon,
  Loader2Icon,
  MapPinIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { buildClassCode } from "@/lib/codes";
import { createClass } from "../actions";
import { CreateClassPreview } from "../components/create-class-preview";
import { IsoDatePicker } from "../../students/components/iso-date-picker";

interface CreateClassFormProps {
  readonly academicYearOptions: string[];
  readonly currency: string;
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

type ScheduleEntry = {
  readonly dayOfWeek: string;
  readonly endsAt: string;
  readonly id: string;
  readonly roomId: string;
  readonly startsAt: string;
};

const dayOptions = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const dayDisplay: Record<string, string> = {
  FRIDAY: "Friday",
  MONDAY: "Monday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  THURSDAY: "Thursday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
};

const timeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const hours = Number.parseInt(hour, 10);
  const minutes = Number.parseInt(minute, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatTime = (time: string) => {
  const minutes = timeToMinutes(time);
  if (minutes === null) return time;
  return formatWallClockTime(time);
};

const newScheduleId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const validate = (
  formData: FormData,
  schedules: ScheduleEntry[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const getValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  if (!getValue("name")) errors.name = "Class name is required.";
  if (!getValue("subjectId")) errors.subjectId = "Subject is required.";
  if (!getValue("levelId")) errors.levelId = "Level is required.";
  if (!getValue("code")) errors.code = "Class code is required.";
  if (!getValue("academicYear")) errors.academicYear = "Academic year is required.";
  if (!getValue("teacherId")) errors.teacherId = "Teacher is required.";
  if (!getValue("startDate")) errors.startDate = "Start date is required.";

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
    if (!schedule.startsAt) errors[`schedule_${index}_start`] = "Start time is required.";
    if (!schedule.endsAt) errors[`schedule_${index}_end`] = "End time is required.";
    if (!schedule.roomId) errors[`schedule_${index}_room`] = "Room is required.";
    if (schedule.startsAt && schedule.endsAt) {
      const start = timeToMinutes(schedule.startsAt);
      const end = timeToMinutes(schedule.endsAt);
      if (start !== null && end !== null && end <= start) {
        errors[`schedule_${index}_time`] = "End time must be after the start time.";
      }
    }
  });

  return errors;
};

const FieldLabel = ({
  children,
  htmlFor,
  required,
}: {
  readonly children: React.ReactNode;
  readonly htmlFor?: string;
  readonly required?: boolean;
}) => (
  <Label htmlFor={htmlFor}>
    {children}
    {required ? <span className="text-destructive text-xs"> *</span> : null}
  </Label>
);

const Hint = ({ children }: { readonly children: React.ReactNode }) => (
  <p className="flex items-center gap-1 text-muted-foreground text-xs">
    <InfoIcon className="size-3" />
    {children}
  </p>
);

const FieldErrorText = ({ message }: { readonly message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-destructive text-xs">
      <AlertCircleIcon className="size-3" />
      {message}
    </p>
  ) : null;

const SectionHeader = ({
  number,
  icon: Icon,
  title,
  subtitle,
}: {
  readonly number: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly subtitle: string;
}) => (
  <span className="flex items-center gap-3">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="size-4 text-primary" />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
          {number}
        </span>
        <span className="font-semibold text-sm">{title}</span>
      </span>
      <span className="text-muted-foreground text-xs">{subtitle}</span>
    </span>
  </span>
);

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <CheckIcon className="size-4" />
          Create class
        </>
      )}
    </Button>
  );
};

export const CreateClassForm = ({
  academicYearOptions,
  currency,
  levels,
  rooms,
  subjects,
  teachers,
}: CreateClassFormProps) => {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [academicYear, setAcademicYear] = useState(academicYearOptions.at(0) ?? "");
  const [capacity, setCapacity] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roomId, setRoomId] = useState("");
  const [classStatus] = useState("Upcoming");
  const [notifyTeacher, setNotifyTeacher] = useState(true);
  const [allowEnrollment, setAllowEnrollment] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([
    { dayOfWeek: "", endsAt: "", id: newScheduleId(), roomId: "", startsAt: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedTeacher = teachers.find((t) => t.id === teacherId);
  const selectedLevel = levels.find((l) => l.id === levelId);

  const subjectItems = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const levelItems = Object.fromEntries(levels.map((l) => [l.id, l.name]));
  const teacherItems = Object.fromEntries(teachers.map((t) => [t.id, t.fullName]));
  const roomItems = Object.fromEntries(
    rooms.map((r) => [r.id, `${r.name}${r.capacity ? ` (max ${r.capacity})` : ""}`])
  );

  const autoClassCode = buildClassCode({
    academicYear,
    levelCode: selectedLevel?.code,
    subjectCode: selectedSubject?.code,
  });
  const [classCode, setClassCode] = useState(autoClassCode);

  useEffect(() => {
    setClassCode(autoClassCode);
  }, [autoClassCode]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

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

  const addDay = () => {
    setSchedules((prev) => [
      ...prev,
      { dayOfWeek: "", endsAt: "", id: newScheduleId(), roomId: "", startsAt: "" },
    ]);
  };

  const removeDay = (id: string) => {
    setSchedules((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const updateSchedule = (id: string, patch: Partial<ScheduleEntry>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const previewSubjectName = selectedSubject?.name;
  const previewLevelName = selectedLevel?.name;

  return (
    <form
      action={createClass}
      className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]"
      onSubmit={handleSubmit}
    >
      {/* hidden inputs for Select-driven fields */}
      <input name="academicYear" type="hidden" value={academicYear} />
      <input name="levelId" type="hidden" value={levelId} />
      <input name="subjectId" type="hidden" value={subjectId} />
      <input name="teacherId" type="hidden" value={teacherId} />
      <input name="capacity" type="hidden" value={capacity} />
      <input name="monthlyFee" type="hidden" value={monthlyFee} />
      {schedules.map((schedule, index) => (
        <div className="contents" key={schedule.id}>
          <input name={`schedules[${index}].dayOfWeek`} type="hidden" value={schedule.dayOfWeek} />
          <input name={`schedules[${index}].startsAt`} type="hidden" value={schedule.startsAt} />
          <input name={`schedules[${index}].endsAt`} type="hidden" value={schedule.endsAt} />
          <input name={`schedules[${index}].roomId`} type="hidden" value={schedule.roomId} />
        </div>
      ))}

      <section className="grid content-start gap-5 xl:col-start-1 xl:row-start-1">
        {/* 01 Class information — ref: form-section 01 */}
        <PreviewCard
          className="flex flex-col"
          header={
            <SectionHeader
              icon={BookOpenIcon}
              number="01"
              subtitle="Enter the basic details for this class."
              title="Class information"
            />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="name" required>
                Class name
              </FieldLabel>
              <Input
                aria-invalid={errors.name ? true : undefined}
                className={errorClassName(Boolean(errors.name))}
                id="name"
                name="name"
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                placeholder="e.g. SPM Mathematics 2026"
                value={name}
              />
              <FieldErrorText message={errors.name} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <FieldLabel required>Subject</FieldLabel>
                <Select
                  items={subjectItems}
                  onValueChange={(v) => {
                    setSubjectId(v ?? "");
                    clearError("subjectId");
                  }}
                  value={subjectId}
                >
                  <SelectTrigger className={errorClassName(Boolean(errors.subjectId))}>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrorText message={errors.subjectId} />
              </div>
              <div className="grid content-start gap-1.5">
                <FieldLabel required>Education level</FieldLabel>
                <Select
                  items={levelItems}
                  onValueChange={(v) => {
                    setLevelId(v ?? "");
                    clearError("levelId");
                  }}
                  value={levelId}
                >
                  <SelectTrigger className={errorClassName(Boolean(errors.levelId))}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrorText message={errors.levelId} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <FieldLabel required>Assigned teacher</FieldLabel>
                <Select
                  items={teacherItems}
                  onValueChange={(v) => {
                    setTeacherId(v ?? "");
                    clearError("teacherId");
                  }}
                  value={teacherId}
                >
                  <SelectTrigger className={errorClassName(Boolean(errors.teacherId))}>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrorText message={errors.teacherId} />
              </div>
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="room">Room / location</FieldLabel>
                <Select
                  items={roomItems}
                  onValueChange={(v) => setRoomId(v ?? "")}
                  value={roomId}
                >
                  <SelectTrigger id="room">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.capacity ? ` (max ${r.capacity})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Hint>Default room — per-day room overrides it.</Hint>
              </div>
            </div>
          </div>
        </PreviewCard>

        {/* 02 Class schedule — ref: form-section 02 + schedule-list */}
        <PreviewCard
          className="flex flex-col"
          header={
            <SectionHeader
              icon={CalendarRangeIcon}
              number="02"
              subtitle="Choose when this class takes place each week."
              title="Class schedule"
            />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <div className="grid gap-3">
            {schedules.map((schedule, index) => {
              const dayError = errors[`schedule_${index}_day`];
              const startError = errors[`schedule_${index}_start`];
              const endError = errors[`schedule_${index}_end`];
              const timeError = errors[`schedule_${index}_time`];
              const roomError = errors[`schedule_${index}_room`];
              const hasTimeError = Boolean(startError || endError || timeError);
              return (
                <div
                  className="grid gap-3 rounded-xl border border-primary/10 bg-secondary/20 p-3"
                  key={schedule.id}
                >
                  <div className="flex items-end gap-2">
                    <div className="grid flex-1 gap-1.5">
                      <div className="hidden sm:grid sm:grid-cols-[1.1fr_1fr_1fr] sm:gap-px sm:*:px-1">
                        <FieldLabel required>Day</FieldLabel>
                        <FieldLabel required>Start time</FieldLabel>
                        <FieldLabel required>End time</FieldLabel>
                      </div>
                      <div className="sm:hidden">
                        <FieldLabel required>Day &amp; Time</FieldLabel>
                      </div>
                      <Group
                        aria-label={`${schedule.dayOfWeek ? (dayDisplay[schedule.dayOfWeek] ?? schedule.dayOfWeek) : "Schedule"} time range`}
                        className={cn(
                          "w-full overflow-hidden shadow-bevel bg-background dark:border-input dark:bg-input/30",
                          (dayError || hasTimeError) &&
                            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
                        )}
                      >
                        <Select
                          items={Object.fromEntries(dayOptions.map((d) => [d, dayDisplay[d]]))}
                          onValueChange={(v) => {
                            updateSchedule(schedule.id, { dayOfWeek: v ?? "" });
                            clearError(`schedule_${index}_day`);
                          }}
                          value={schedule.dayOfWeek}
                        >
                          <SelectTrigger
                            aria-label="Day"
                            className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
                          >
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {dayOptions.map((d) => (
                              <SelectItem key={d} value={d}>
                                {dayDisplay[d]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <GroupSeparator />
                        <GroupText render={<Label htmlFor={`schedule-${schedule.id}-start`} />}>
                          From
                        </GroupText>
                        <GroupSeparator />
                        <Input
                          aria-label="Start time"
                          className="flex-1 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent focus-within:ring-0 [&_[data-slot=input]]:bg-transparent"
                          id={`schedule-${schedule.id}-start`}
                          onChange={(e) => {
                            updateSchedule(schedule.id, { startsAt: e.target.value });
                            clearError(`schedule_${index}_start`);
                            clearError(`schedule_${index}_time`);
                          }}
                          type="time"
                          value={schedule.startsAt}
                        />
                        <GroupSeparator />
                        <GroupText render={<Label htmlFor={`schedule-${schedule.id}-end`} />}>
                          To
                        </GroupText>
                        <GroupSeparator />
                        <Input
                          aria-label="End time"
                          className="flex-1 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent focus-within:ring-0 [&_[data-slot=input]]:bg-transparent"
                          id={`schedule-${schedule.id}-end`}
                          onChange={(e) => {
                            updateSchedule(schedule.id, { endsAt: e.target.value });
                            clearError(`schedule_${index}_end`);
                            clearError(`schedule_${index}_time`);
                          }}
                          type="time"
                          value={schedule.endsAt}
                        />
                      </Group>
                      <div className="grid gap-1 sm:grid-cols-[1.1fr_1fr_1fr]">
                        <FieldErrorText message={dayError} />
                        <FieldErrorText message={startError || timeError} />
                        <FieldErrorText message={endError} />
                      </div>
                      {timeError && !startError && !endError ? (
                        <FieldErrorText message={timeError} />
                      ) : null}
                    </div>
                    <Button
                      aria-label="Remove schedule"
                      className="h-9 w-9 shrink-0"
                      disabled={schedules.length === 1}
                      onClick={() => removeDay(schedule.id)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-1.5">
                    <FieldLabel required>Room</FieldLabel>
                    <Select
                      items={roomItems}
                      onValueChange={(v) => {
                        updateSchedule(schedule.id, { roomId: v ?? "" });
                        clearError(`schedule_${index}_room`);
                      }}
                      value={schedule.roomId}
                    >
                      <SelectTrigger className={errorClassName(Boolean(roomError))} size="sm">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                            {r.capacity ? ` (max ${r.capacity})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldErrorText message={roomError} />
                  </div>
                </div>
              );
            })}
            <Button
              className="w-fit bg-primary/10 text-primary hover:bg-primary/15"
              onClick={addDay}
              size="sm"
              type="button"
              variant="ghost"
            >
              ＋ Add another day
            </Button>
            <FieldErrorText message={errors.schedules} />
          </div>
        </PreviewCard>

        {/* 03 Capacity and fees — ref: form-section 03 */}
        <PreviewCard
          className="flex flex-col"
          header={
            <SectionHeader
              icon={Settings2Icon}
              number="03"
              subtitle="Set the maximum number of students and monthly class fee."
              title="Capacity and fees"
            />
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="capacity" required>
                Maximum students
              </FieldLabel>
              <Input
                id="capacity"
                min="1"
                max="100"
                onChange={(e) => {
                  setCapacity(e.target.value);
                  clearError("capacity");
                }}
                placeholder="e.g. 20"
                type="number"
                value={capacity}
              />
              <Hint>Students will not be able to enrol once this limit is reached.</Hint>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="monthlyFee">Monthly fee</FieldLabel>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground text-sm">
                  RM
                </span>
                <Input
                  className="pl-10"
                  id="monthlyFee"
                  min="0"
                  step="0.01"
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  placeholder="e.g. 120.00"
                  type="number"
                  value={monthlyFee}
                />
              </div>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel required>Class start date</FieldLabel>
              <IsoDatePicker
                name="startDate"
                onChange={(iso) => {
                  setStartDate(iso);
                  clearError("startDate");
                }}
                placeholder="Select start date"
                value={startDate}
              />
              <FieldErrorText message={errors.startDate} />
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="endDate">Class end date</FieldLabel>
              <IsoDatePicker
                name="endDate"
                onChange={(iso) => {
                  setEndDate(iso);
                  clearError("endDate");
                }}
                placeholder="Select end date"
                value={endDate}
              />
              <FieldErrorText message={errors.endDate} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="code" required>
                Class code
              </FieldLabel>
              <Input
                aria-invalid={errors.code ? true : undefined}
                className={errorClassName(Boolean(errors.code))}
                id="code"
                name="code"
                onChange={(e) => {
                  setClassCode(e.target.value);
                  clearError("code");
                }}
                placeholder="e.g. PHY-SPM-26"
                value={classCode}
              />
              <FieldErrorText message={errors.code} />
              <Hint>Auto-generated from subject, level, and year. Editable if needed.</Hint>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel required>Academic year</FieldLabel>
              <Select onValueChange={(v) => setAcademicYear(v ?? "")} value={academicYear}>
                <SelectTrigger className={errorClassName(Boolean(errors.academicYear))}>
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
              <FieldErrorText message={errors.academicYear} />
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel>Class status</FieldLabel>
              <Input disabled value={classStatus} />
              <Hint>UI only — new classes start as Active.</Hint>
            </div>
          </div>
        </PreviewCard>

        {/* 04 Additional information — ref: form-section 04, collapsible like student */}
        <Collapsible>
          <PreviewCard
            className="flex flex-col"
            header={
              <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MoreHorizontalIcon className="size-4 text-primary" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                        04
                      </span>
                      <span className="font-semibold text-sm">Additional information</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Add notes that may be useful for parents, students or teachers.
                    </span>
                  </span>
                </span>
                <CollapsibleTrigger
                  render={<Button size="icon" type="button" variant="ghost" />}
                >
                  <ChevronDownIcon className="size-4 in-[[data-panel-open]]:rotate-180 transition-transform" />
                  <span className="sr-only">Toggle additional information</span>
                </CollapsibleTrigger>
              </div>
            }
            stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
          >
            <CollapsibleContent className="grid gap-4">
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="description">Class description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly SPM preparation class covering algebra, graphs and problem solving."
                  rows={3}
                  value={description}
                />
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="remarks">Remarks (optional)</FieldLabel>
                <Textarea
                  id="remarks"
                  name="remarks"
                  placeholder="Any additional notes for this class..."
                  rows={2}
                />
              </div>
              <label className="flex items-start gap-2.5 rounded-lg border bg-card p-3">
                <input
                  checked={notifyTeacher}
                  className="mt-0.5 size-4 accent-primary"
                  onChange={(e) => setNotifyTeacher(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm leading-tight">
                  Notify the assigned teacher when this class is created.
                  <span className="block text-muted-foreground text-xs">UI only</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 rounded-lg border bg-card p-3">
                <input
                  checked={allowEnrollment}
                  className="mt-0.5 size-4 accent-primary"
                  onChange={(e) => setAllowEnrollment(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm leading-tight">
                  Allow students to enrol in this class immediately.
                  <span className="block text-muted-foreground text-xs">UI only</span>
                </span>
              </label>
            </CollapsibleContent>
          </PreviewCard>
        </Collapsible>

        {Object.keys(errors).length > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            <AlertCircleIcon className="size-4 shrink-0" />
            Please complete all required fields before saving.
          </div>
        ) : null}
      </section>

      <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
        <CreateClassPreview
          academicYear={academicYear}
          capacity={capacity}
          classCode={classCode}
          currency={currency}
          description={description}
          levelName={previewLevelName}
          monthlyFee={monthlyFee}
          name={name}
          rooms={rooms}
          schedules={schedules}
          startDate={startDate}
          subjectName={previewSubjectName}
          teacherName={selectedTeacher?.fullName}
        />
      </aside>

      <div className="order-3 flex flex-col gap-3 sm:flex-row xl:col-start-1 xl:row-start-2">
        <div className="flex items-center gap-2 text-muted-foreground text-xs sm:mr-auto">
          <span className="text-destructive">*</span> Required fields
        </div>
        <Button render={<Link href="/classes" />} size="lg" type="button" variant="outline">
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
};
