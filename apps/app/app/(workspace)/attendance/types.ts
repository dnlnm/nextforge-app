import type { AttendanceStatus } from "@repo/schemas/enums";

export interface SessionStudentView {
  id: string;
  initials: string;
  name: string;
  note: string;
  status: AttendanceStatus | null;
}

export interface SessionView {
  classId: string;
  className: string;
  /** ISO calendar date ("yyyy-MM-dd") for the session, in Malaysia time. */
  date: string;
  dateLabel: string;
  endsAt: string;
  grade: string;
  id: string;
  saved: boolean;
  startsAt: string;
  students: SessionStudentView[];
  subject: string;
  teacher: string;
}

export interface HistoryRowView {
  absent: number;
  date: string;
  excused: number;
  grade: string;
  id: string;
  late: number;
  present: number;
  rate: number;
  session: string;
  total: number;
}

export interface WeekDayView {
  /** ISO calendar date ("yyyy-MM-dd"). */
  date: string;
  day: number;
  isPast: boolean;
  isToday: boolean;
  label: string;
  savedCount: number;
  totalCount: number;
}

export interface HistoryStatsView {
  absentEvents: number;
  avgRate: number;
  monthLabel: string;
  perfectDays: number;
  totalSessions: number;
}
