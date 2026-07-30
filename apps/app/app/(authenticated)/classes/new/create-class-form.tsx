"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
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
  CalendarDaysIcon,
  CalendarRangeIcon,
  Clock3Icon,
  MapPinIcon,
  Settings2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createClass } from "../actions";

interface CreateClassFormProps {
  readonly subjects: Array<{
    readonly academicLevel: string | null;
    readonly id: string;
    readonly name: string;
  }>;
  readonly teachers: Array<{
    readonly fullName: string;
    readonly id: string;
  }>;
}

const whitespaceRegex = /\s+/;
const nonAlphanumericRegex = /[^a-zA-Z0-9]/g;

const dayOptions = [
  ["MONDAY", "Mon"],
  ["TUESDAY", "Tue"],
  ["WEDNESDAY", "Wed"],
  ["THURSDAY", "Thu"],
  ["FRIDAY", "Fri"],
  ["SATURDAY", "Sat"],
  ["SUNDAY", "Sun"],
] as const;

const mediumOptions = ["English", "Bahasa Malaysia", "Chinese", "Tamil"];

const formatClassCode = (name: string) => {
  const prefix = name
    .split(whitespaceRegex)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(nonAlphanumericRegex, "").slice(0, 4))
    .filter(Boolean)
    .join("-")
    .toUpperCase();

  return `${prefix || "CLS"}-01`;
};

const defaultSelectedDays = ["TUESDAY", "THURSDAY"];

export const CreateClassForm = ({ subjects, teachers }: CreateClassFormProps) => {
  const [name, setName] = useState("SPM Physics (2025)");
  const [subjectId, setSubjectId] = useState(subjects.at(0)?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers.at(0)?.id ?? "");
  const [academicYear, setAcademicYear] = useState("2025");
  const [medium, setMedium] = useState("Bahasa Malaysia");
  const [room, setRoom] = useState("Room 2A");
  const [monthlyFee, setMonthlyFee] = useState("200.00");
  const [capacity, setCapacity] = useState("25");
  const [minimumStudents, setMinimumStudents] = useState("5");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(defaultSelectedDays);
  const [startTime, setStartTime] = useState("07:30 PM");
  const [endTime, setEndTime] = useState("09:30 PM");
  const [startDate, setStartDate] = useState("22/05/2025");
  const [endDate, setEndDate] = useState("");

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const selectedTeacher = teachers.find((teacher) => teacher.id === teacherId);

  const selectedLevel = selectedSubject?.academicLevel ?? "Select level";
  const selectedTags = useMemo(
    () => [selectedSubject?.academicLevel, selectedSubject?.name].filter(Boolean) as string[],
    [selectedSubject]
  );
  const scheduleSummary = [
    selectedDays.map((day) => dayOptions.find(([value]) => value === day)?.[1] ?? day).join(", ") || "Select days",
    `${startTime} - ${endTime}`,
    room || "Select classroom",
  ];
  const primaryDay = selectedDays.at(0) ?? "TUESDAY";

  return (
    <>
      <section className="grid content-start gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="size-5" />
              Class Information
            </CardTitle>
            <CardDescription>Create the core class details first.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createClass} className="grid gap-4">
              <input name="dayOfWeek" type="hidden" value={primaryDay} />
              <input name="endsAt" type="hidden" value={endTime} />
              <input name="startsAt" type="hidden" value={startTime} />
              <input name="teacherId" type="hidden" value={teacherId} />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2 md:col-span-1">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    autoComplete="organization"
                    id="name"
                    name="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. SPM Physics (2025)"
                    required
                    value={name}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subjectId">Subject *</Label>
                  <input name="subjectId" type="hidden" value={subjectId} />
                  <Select onValueChange={setSubjectId} value={subjectId}>
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.academicLevel
                            ? `${subject.academicLevel} ${subject.name}`
                            : subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="level">Level *</Label>
                  <Input
                    id="level"
                    placeholder="Select level"
                    readOnly
                    value={selectedLevel}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="code">Class Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g. PHY-SPM-01"
                    readOnly
                    value={formatClassCode(name)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Select onValueChange={setAcademicYear} value={academicYear}>
                    <SelectTrigger id="academicYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["2025", "2026", "2027"].map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="medium">Medium of Instruction</Label>
                  <Select onValueChange={setMedium} value={medium}>
                    <SelectTrigger id="medium">
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediumOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter class description, focus areas, or notes..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2 md:col-span-2">
                  <fieldset className="grid gap-2">
                    <legend className="font-medium text-sm">Day(s) *</legend>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map(([value, label]) => {
                        const checked = selectedDays.includes(value);

                        return (
                          <button
                            aria-pressed={checked}
                            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-muted/50"
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelectedDays((current) =>
                                checked
                                  ? current.filter((day) => day !== value)
                                  : [...new Set([...current, value])]
                              );
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(state) => {
                                setSelectedDays((current) =>
                                  state
                                    ? [...new Set([...current, value])]
                                    : current.filter((day) => day !== value)
                                );
                              }}
                            />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time-start">Time *</Label>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Input
                      id="time-start"
                      onChange={(event) => setStartTime(event.target.value)}
                      value={startTime}
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      id="time-end"
                      onChange={(event) => setEndTime(event.target.value)}
                      value={endTime}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    onChange={(event) => setStartDate(event.target.value)}
                    value={startDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    placeholder="Select end date"
                    onChange={(event) => setEndDate(event.target.value)}
                    value={endDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="room">Location / Classroom *</Label>
                  <Select onValueChange={setRoom} value={room}>
                    <SelectTrigger id="room">
                      <SelectValue placeholder="Select classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Room 2A",
                        "Room 2B",
                        "Room 3A",
                        "Online",
                      ].map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2Icon className="size-5" />
                    Class Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Maximum Students</Label>
                      <Input
                        id="capacity"
                        min="1"
                        name="capacity"
                        onChange={(event) => setCapacity(event.target.value)}
                        type="number"
                        value={capacity}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="minimumStudents">Minimum Students (optional)</Label>
                      <Input
                        id="minimumStudents"
                        min="1"
                        type="number"
                        onChange={(event) => setMinimumStudents(event.target.value)}
                        value={minimumStudents}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthlyFee">Class Fee (RM)</Label>
                      <Input
                        id="monthlyFee"
                        placeholder="e.g. 200.00"
                        name="monthlyFee"
                        onChange={(event) => setMonthlyFee(event.target.value)}
                        value={monthlyFee}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks (optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Any additional notes for this class..."
                      onChange={(event) => setRemarks(event.target.value)}
                      value={remarks}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button asChild variant="outline">
                  <a href="/classes">Cancel</a>
                </Button>
                <Button type="submit">Save Class</Button>
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
                  <p className="font-semibold text-lg">{name}</p>
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
                  <p className="font-medium">{formatClassCode(name)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Academic Year</p>
                  <p className="font-medium">{academicYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Medium</p>
                  <p className="font-medium">{medium}</p>
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
            <div className="flex items-start gap-3">
              <CalendarDaysIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="grid gap-0.5">
                <p className="text-muted-foreground">Days</p>
                <p>{scheduleSummary[0]}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3Icon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="grid gap-0.5">
                <p className="text-muted-foreground">Time</p>
                <p>{scheduleSummary[1]}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPinIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="grid gap-0.5">
                <p className="text-muted-foreground">Location</p>
                <p>{scheduleSummary[2]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Teacher</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="teacherId">Main Teacher *</Label>
              <Select onValueChange={setTeacherId} value={teacherId}>
                <SelectTrigger id="teacherId">
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
            </div>
          </CardContent>
        </Card>
      </aside>
    </>
  );
};
