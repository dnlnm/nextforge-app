"use client";

import type { DayOfWeek } from "@repo/database";
import { formatMoneyCsv } from "@repo/money";
import { Button } from "@repo/design-system/components/ui/button";
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
import { useState } from "react";
import { updateClass } from "../actions";
import {
  ScheduleBuilder,
  type ScheduleEntry,
} from "../components/schedule-builder";

interface ClassEditFormProps {
  readonly classId: string;
  readonly initialSchedules: Array<{
    readonly dayOfWeek: DayOfWeek;
    readonly endsAt: string;
    readonly id: string;
    readonly roomId: string | null;
    readonly startsAt: string;
  }>;
  readonly initialValues: {
    readonly academicYear: number;
    readonly capacity: number | null;
    readonly code: string;
    readonly endsOn: Date | null;
    readonly levelId: string | null;
    readonly monthlyFeeSen: number;
    readonly name: string;
    readonly startsOn: Date;
    readonly subjectId: string;
    readonly teacherId: string | null;
  };
  readonly levels: Array<{ readonly id: string; readonly name: string }>;
  readonly rooms: Array<{
    readonly capacity: number | null;
    readonly id: string;
    readonly name: string;
  }>;
  readonly subjects: Array<{ readonly id: string; readonly name: string }>;
  readonly teachers: Array<{ readonly fullName: string; readonly id: string }>;
}

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

export const ClassEditForm = ({
  classId,
  initialSchedules,
  initialValues,
  levels,
  rooms,
  subjects,
  teachers,
}: ClassEditFormProps) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(
    initialSchedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      endsAt: schedule.endsAt,
      id: schedule.id,
      roomId: schedule.roomId ?? "",
      startsAt: schedule.startsAt,
    }))
  );

  return (
    <form action={updateClass} className="grid gap-4">
      <input name="classId" type="hidden" value={classId} />
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
      <div className="grid gap-2">
        <Label htmlFor="name">Class name</Label>
        <Input
          defaultValue={initialValues.name}
          id="name"
          name="name"
          required
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="code">Class code</Label>
          <Input
            defaultValue={initialValues.code}
            id="code"
            name="code"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="academicYear">Academic year</Label>
          <Input
            defaultValue={initialValues.academicYear}
            id="academicYear"
            min="2000"
            name="academicYear"
            required
            type="number"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <Select
          defaultValue={initialValues.subjectId}
          name="subjectId"
          required
        >
          <SelectTrigger id="subjectId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="levelId">Level</Label>
        <Select defaultValue={initialValues.levelId ?? "none"} name="levelId">
          <SelectTrigger id="levelId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No level</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <Select
          defaultValue={initialValues.teacherId ?? "none"}
          name="teacherId"
        >
          <SelectTrigger id="teacherId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No teacher yet</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="grid gap-3">
        <legend className="font-medium text-sm">Schedule</legend>
        <ScheduleBuilder
          classCapacity={initialValues.capacity ?? 0}
          errors={{}}
          onSchedulesChange={setSchedules}
          rooms={rooms}
          schedules={schedules}
        />
      </fieldset>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <DatePicker
            defaultValue={toDateString(initialValues.startsOn)}
            id="startDate"
            name="startDate"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">End date (optional)</Label>
          <DatePicker
            defaultValue={
              initialValues.endsOn ? toDateString(initialValues.endsOn) : ""
            }
            id="endDate"
            name="endDate"
          />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="monthlyFee">Monthly fee</Label>
          <Input
            defaultValue={formatMoneyCsv(initialValues.monthlyFeeSen)}
            id="monthlyFee"
            min="0"
            name="monthlyFee"
            step="0.01"
            type="number"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            defaultValue={initialValues.capacity ?? ""}
            id="capacity"
            min="1"
            name="capacity"
            type="number"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save changes</Button>
        <Button variant="outline" render={<a href="/classes" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
