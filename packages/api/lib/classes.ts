import { database } from "@repo/database";
import {
  buildClassCode,
  isValidClassCode,
  normalizeClassCode,
} from "@repo/schemas/codes";
import { type DayOfWeek, daysOfWeek } from "@repo/schemas/enums";

const days = new Set<DayOfWeek>(daysOfWeek);

export interface ClassScheduleInput {
  readonly dayOfWeek: DayOfWeek;
  readonly endsAt: string;
  readonly roomId: string;
  readonly startsAt: string;
}

const timeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const hours = Number.parseInt(hour, 10);
  const minutes = Number.parseInt(minute, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const timesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  if (s1 === null || e1 === null || s2 === null || e2 === null) {
    return false;
  }

  return s1 < e2 && s2 < e1;
};

/** Validates schedules, rooms and duplicate days. Mirrors the web action. */
export const assertSchedulesValid = async (
  organizationId: string,
  schedules: ClassScheduleInput[]
) => {
  if (schedules.length === 0) {
    throw new Error("At least one schedule is required.");
  }

  const seenDays = new Set<DayOfWeek>();

  for (const schedule of schedules) {
    if (!days.has(schedule.dayOfWeek)) {
      throw new Error(`Invalid class day: ${schedule.dayOfWeek}`);
    }

    if (seenDays.has(schedule.dayOfWeek)) {
      throw new Error("Each schedule must use a different day of the week.");
    }

    seenDays.add(schedule.dayOfWeek);

    const start = timeToMinutes(schedule.startsAt);
    const end = timeToMinutes(schedule.endsAt);

    if (start === null || end === null) {
      throw new Error("Schedule times must use the HH:MM format.");
    }

    if (end <= start) {
      throw new Error("Schedule end time must be after the start time.");
    }

    const room = await database.room.findFirst({
      where: {
        id: schedule.roomId,
        organizationId,
        status: "ACTIVE",
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!room) {
      throw new Error("A selected room could not be found.");
    }
  }
};

/** Detects teacher schedule conflicts. Mirrors the web action. */
export const assertNoTeacherConflicts = async (
  organizationId: string,
  teacherId: string,
  schedules: ClassScheduleInput[],
  excludedClassId?: string
) => {
  const conflictingClasses = await database.learningClass.findMany({
    where: {
      organizationId,
      teacherId,
      status: "ACTIVE",
      archivedAt: null,
      ...(excludedClassId ? { NOT: { id: excludedClassId } } : {}),
    },
    select: {
      name: true,
      schedules: {
        select: { dayOfWeek: true, endsAt: true, startsAt: true },
      },
    },
  });

  const conflicts: string[] = [];

  for (const schedule of schedules) {
    for (const existingClass of conflictingClasses) {
      for (const existingSchedule of existingClass.schedules) {
        if (
          existingSchedule.dayOfWeek === schedule.dayOfWeek &&
          timesOverlap(
            schedule.startsAt,
            schedule.endsAt,
            existingSchedule.startsAt,
            existingSchedule.endsAt
          )
        ) {
          conflicts.push(
            `${existingClass.name} (${existingSchedule.dayOfWeek} ${existingSchedule.startsAt}-${existingSchedule.endsAt})`
          );
        }
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Teacher has a scheduling conflict with: ${conflicts.join(", ")}`
    );
  }
};

/** Resolves a unique class code for an organization. Mirrors the web action. */
export const resolveClassCode = async (
  organizationId: string,
  {
    academicYear,
    levelCode,
    submittedCode,
    subjectCode,
  }: {
    academicYear: number;
    levelCode: string;
    submittedCode?: string;
    subjectCode: string;
  }
) => {
  if (submittedCode) {
    const code = normalizeClassCode(submittedCode);

    if (!isValidClassCode(code)) {
      throw new Error(
        "Class code can only contain letters, numbers, and dashes."
      );
    }

    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (clash) {
      throw new Error("A class with this code already exists.");
    }

    return code;
  }

  const base = buildClassCode({ academicYear, levelCode, subjectCode });
  let suffix = 1;
  let code = base;

  while (true) {
    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (!clash) {
      return code;
    }

    suffix += 1;
    code = buildClassCode({
      academicYear,
      levelCode,
      subjectCode,
      suffix,
    });
  }
};
