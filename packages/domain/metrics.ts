import "server-only";

import type { AttendanceStatus } from "@repo/database";

export interface ScheduleSlice {
  readonly endsAt: string;
  readonly startsAt: string;
}

export interface AttendanceCounts {
  absent: number;
  excused: number;
  late: number;
  present: number;
}

export type WorkloadCategory = "LIGHT" | "MEDIUM" | "HEAVY";

const minutesInDay = 24 * 60;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeToMinutes = (time: string): number | null => {
  if (!timePattern.test(time)) {
    return null;
  }

  const [hour = "0", minute = "0"] = time.split(":");
  const hours = Number.parseInt(hour, 10);
  const minutes = Number.parseInt(minute, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

export const timesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  if (s1 === null || e1 === null || s2 === null || e2 === null) {
    return false;
  }

  return s1 < e2 && s2 < e1;
};

export const scheduleDurationMinutes = (schedule: ScheduleSlice): number => {
  const start = timeToMinutes(schedule.startsAt);
  const end = timeToMinutes(schedule.endsAt);

  if (start === null || end === null) {
    return 0;
  }

  if (end > start) {
    return end - start;
  }

  // A schedule that crosses midnight.
  return minutesInDay - start + end;
};

/**
 * Total weekly minutes from a set of schedules. Overlapping schedules within the
 * same slot are not double-counted; distinct slots are summed.
 */
export const weeklyMinutes = (schedules: readonly ScheduleSlice[]): number =>
  schedules.reduce(
    (total, schedule) => total + scheduleDurationMinutes(schedule),
    0
  );

export const weeklyTeachingHours = (
  schedules: readonly ScheduleSlice[]
): number => weeklyMinutes(schedules) / 60;

/**
 * Attendance rate per the shared contract: (PRESENT + LATE) / all non-EXCUSED
 * marked records * 100. Returns null when the denominator is zero.
 */
export const attendanceRate = (
  statuses: readonly AttendanceStatus[]
): number | null => {
  const counts = countAttendance(statuses);
  const denominator = counts.present + counts.late + counts.absent;

  if (denominator === 0) {
    return null;
  }

  return Math.round(((counts.present + counts.late) / denominator) * 100);
};

export const countAttendance = (
  statuses: readonly AttendanceStatus[]
): AttendanceCounts => {
  const counts: AttendanceCounts = {
    absent: 0,
    excused: 0,
    late: 0,
    present: 0,
  };

  for (const status of statuses) {
    switch (status) {
      case "ABSENT":
        counts.absent += 1;
        break;
      case "EXCUSED":
        counts.excused += 1;
        break;
      case "LATE":
        counts.late += 1;
        break;
      case "PRESENT":
        counts.present += 1;
        break;
      default:
        break;
    }
  }

  return counts;
};

/**
 * Teacher workload category by active class count:
 * Light 0-5, Medium 6-10, Heavy 11+.
 */
export const workloadCategory = (classCount: number): WorkloadCategory => {
  if (classCount <= 5) {
    return "LIGHT";
  }

  if (classCount <= 10) {
    return "MEDIUM";
  }

  return "HEAVY";
};

export const workloadCategoryLabel = (category: WorkloadCategory): string => {
  switch (category) {
    case "LIGHT":
      return "Light (0-5 classes)";
    case "MEDIUM":
      return "Medium (6-10 classes)";
    case "HEAVY":
      return "Heavy (11+ classes)";
    default:
      return category;
  }
};

export interface MoneySummary {
  readonly outstandingSen: number;
  readonly totalBilledSen: number;
  readonly totalPaidSen: number;
}

export const invoiceBalanceSen = (invoice: {
  readonly amountPaidSen: number;
  readonly totalSen: number;
}): number => Math.max(0, invoice.totalSen - invoice.amountPaidSen);

export const summarizeInvoices = (
  invoices: readonly {
    readonly amountPaidSen: number;
    readonly totalSen: number;
  }[]
): MoneySummary => {
  let totalBilledSen = 0;
  let totalPaidSen = 0;
  let outstandingSen = 0;

  for (const invoice of invoices) {
    totalBilledSen += invoice.totalSen;
    totalPaidSen += invoice.amountPaidSen;
    outstandingSen += invoiceBalanceSen(invoice);
  }

  return { outstandingSen, totalBilledSen, totalPaidSen };
};

export interface CapacityInfo {
  readonly capacity: number | null;
  readonly enrolled: number;
  readonly isFull: boolean;
  readonly percentFull: number | null;
}

export const capacityInfo = (
  enrolled: number,
  capacity: number | null
): CapacityInfo => {
  if (capacity === null || capacity <= 0) {
    return { capacity: null, enrolled, isFull: false, percentFull: null };
  }

  return {
    capacity,
    enrolled,
    isFull: enrolled >= capacity,
    percentFull: Math.round((enrolled / capacity) * 100),
  };
};
