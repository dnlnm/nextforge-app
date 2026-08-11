import "server-only";

import type { PrismaClient } from "@repo/database";
import { type DayOfWeek, daysOfWeek } from "@repo/schemas/enums";
import { timesOverlap } from "../metrics";

const days = new Set<DayOfWeek>(daysOfWeek);

export interface ScheduleInput {
  readonly dayOfWeek: DayOfWeek;
  readonly endsAt: string;
  readonly roomId: string;
  readonly startsAt: string;
}

export interface ScheduleConflict {
  readonly className: string;
  readonly dayOfWeek: DayOfWeek;
  readonly endsAt: string;
  readonly startsAt: string;
}

export class ScheduleValidationError extends Error {
  readonly conflicts: readonly ScheduleConflict[];

  constructor(conflicts: readonly ScheduleConflict[]) {
    super(
      `Scheduling conflict with: ${conflicts
        .map((c) => `${c.className} (${c.dayOfWeek} ${c.startsAt}-${c.endsAt})`)
        .join(", ")}`
    );
    this.name = "ScheduleValidationError";
    this.conflicts = conflicts;
  }
}

const scheduleMatches = (
  schedule: ScheduleInput,
  existing: {
    readonly dayOfWeek: DayOfWeek;
    readonly endsAt: string;
    readonly startsAt: string;
  }
): boolean =>
  schedule.dayOfWeek === existing.dayOfWeek &&
  timesOverlap(
    schedule.startsAt,
    schedule.endsAt,
    existing.startsAt,
    existing.endsAt
  );

/**
 * Validates schedule shape and room existence. Throws with actionable messages.
 */
export const assertSchedulesValid = async (
  db: Pick<PrismaClient, "room">,
  organizationId: string,
  schedules: readonly ScheduleInput[]
): Promise<void> => {
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

    const room = await db.room.findFirst({
      where: {
        archivedAt: null,
        id: schedule.roomId,
        organizationId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!room) {
      throw new Error("A selected room could not be found.");
    }
  }
};

/**
 * Returns a structured list of teacher schedule conflicts.
 */
export const findTeacherConflicts = (
  schedules: readonly ScheduleInput[],
  existingClasses: readonly {
    readonly name: string;
    readonly schedules: readonly {
      readonly dayOfWeek: DayOfWeek;
      readonly endsAt: string;
      readonly startsAt: string;
    }[];
  }[]
): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];

  for (const schedule of schedules) {
    for (const existingClass of existingClasses) {
      for (const existingSchedule of existingClass.schedules) {
        if (scheduleMatches(schedule, existingSchedule)) {
          conflicts.push({
            className: existingClass.name,
            dayOfWeek: schedule.dayOfWeek,
            endsAt: schedule.endsAt,
            startsAt: schedule.startsAt,
          });
        }
      }
    }
  }

  return conflicts;
};

export const assertNoTeacherConflicts = (
  schedules: readonly ScheduleInput[],
  existingClasses: readonly {
    readonly name: string;
    readonly schedules: readonly {
      readonly dayOfWeek: DayOfWeek;
      readonly endsAt: string;
      readonly startsAt: string;
    }[];
  }[]
): void => {
  const conflicts = findTeacherConflicts(schedules, existingClasses);

  if (conflicts.length > 0) {
    throw new ScheduleValidationError(conflicts);
  }
};

/**
 * Returns a structured list of room schedule conflicts. A room cannot host two
 * classes at the same time on the same weekday.
 */
export const findRoomConflicts = (
  schedules: readonly ScheduleInput[],
  existingSchedules: readonly {
    readonly className: string;
    readonly dayOfWeek: DayOfWeek;
    readonly endsAt: string;
    readonly roomId: string;
    readonly startsAt: string;
  }[]
): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];

  for (const schedule of schedules) {
    for (const existing of existingSchedules) {
      if (
        existing.roomId === schedule.roomId &&
        scheduleMatches(schedule, existing)
      ) {
        conflicts.push({
          className: existing.className,
          dayOfWeek: schedule.dayOfWeek,
          endsAt: schedule.endsAt,
          startsAt: schedule.startsAt,
        });
      }
    }
  }

  return conflicts;
};
