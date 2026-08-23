import { requireTenant } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import {
  addMalaysiaCalendarDays,
  formatCalendarDate,
  formatLongMonthYear,
  formatShortDate,
  getMalaysiaToday,
  getMalaysiaWeekday,
} from "@repo/date";
import type { AttendanceStatus } from "@repo/schemas/enums";
import { findTeacherProfileForUser } from "@/lib/teacher-profile";
import { Header } from "../components/header";
import { AttendanceView } from "./attendance-view";
import type {
  HistoryRowView,
  HistoryStatsView,
  SessionView,
  WeekDayView,
} from "./types";

const WEEKDAY_SHORT: Record<string, string> = {
  FRIDAY: "Fri",
  MONDAY: "Mon",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
  THURSDAY: "Thu",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
};

const countByStatus = (
  records: { status: AttendanceStatus }[],
  status: AttendanceStatus
) => records.filter((record) => record.status === status).length;

const WHITESPACE_RE = /\s+/;

const getInitials = (name: string): string =>
  name
    .split(WHITESPACE_RE)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface SessionWithDetails {
  attendance: {
    studentId: string;
    status: AttendanceStatus;
    notes: string | null;
  }[];
  class: {
    id: string;
    name: string;
    code: string;
    teacher: { fullName: string } | null;
    subject: { name: string } | null;
    level: { name: string } | null;
    enrollments: {
      student: { id: string; fullName: string };
    }[];
  };
  endsAt: string;
  id: string;
  sessionDate: Date;
  startsAt: string;
  status: string;
}

const toSessionView = (session: SessionWithDetails): SessionView => {
  const attendanceByStudent = new Map(
    session.attendance.map((record) => [record.studentId, record])
  );

  return {
    id: session.id,
    date: formatCalendarDate(session.sessionDate),
    dateLabel: formatShortDate(session.sessionDate),
    classId: session.class.id,
    className: session.class.name,
    subject: session.class.subject?.name ?? "",
    grade: session.class.level?.name ?? session.class.code,
    teacher: session.class.teacher?.fullName ?? "",
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    saved: session.status === "COMPLETED",
    students: session.class.enrollments.map((enrollment) => {
      const attendance = attendanceByStudent.get(enrollment.student.id);
      const name = enrollment.student.fullName;

      return {
        id: enrollment.student.id,
        name,
        initials: getInitials(name),
        status: attendance?.status ?? null,
        note: attendance?.notes ?? "",
      };
    }),
  };
};

const toHistoryRow = (session: SessionWithDetails): HistoryRowView => {
  const total = session.attendance.length;
  const present = countByStatus(session.attendance, "PRESENT");
  const late = countByStatus(session.attendance, "LATE");
  const absent = countByStatus(session.attendance, "ABSENT");
  const excused = countByStatus(session.attendance, "EXCUSED");

  return {
    id: session.id,
    date: formatShortDate(session.sessionDate),
    session: session.class.name,
    grade: session.class.level?.name ?? session.class.code,
    total,
    present,
    late,
    absent,
    excused,
    rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
  };
};

const AttendancePage = async () => {
  const tenant = await requireTenant();
  const today = getMalaysiaToday();
  const todayIso = formatCalendarDate(today);

  const teacher =
    tenant.role === "TEACHER"
      ? await findTeacherProfileForUser(tenant.organizationId, tenant.userId)
      : null;
  const classVisibility =
    tenant.role === "TEACHER" ? { teacherId: teacher?.id ?? "__none__" } : {};

  const weekdayIndex = Math.max(
    0,
    [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ].indexOf(getMalaysiaWeekday(today))
  );
  const weekStart = addMalaysiaCalendarDays(today, -weekdayIndex);
  const weekEnd = addMalaysiaCalendarDays(weekStart, 6);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );

  const sessionInclude = {
    attendance: {
      select: {
        notes: true,
        status: true,
        studentId: true,
      },
    },
    class: {
      include: {
        enrollments: {
          include: { student: { select: { fullName: true, id: true } } },
          orderBy: { student: { fullName: "asc" as const } },
          where: { status: "ACTIVE" as const },
        },
        level: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
    },
  } as const;

  const [weekSessions, monthSessions] = await Promise.all([
    database.classSession.findMany({
      where: {
        organizationId: tenant.organizationId,
        class: classVisibility,
        sessionDate: { gte: weekStart, lte: weekEnd },
      },
      include: sessionInclude,
      orderBy: [{ sessionDate: "asc" }, { startsAt: "asc" }],
    }),
    database.classSession.findMany({
      where: {
        organizationId: tenant.organizationId,
        class: classVisibility,
        status: "COMPLETED",
        sessionDate: { gte: monthStart, lte: today },
      },
      include: sessionInclude,
      orderBy: [{ sessionDate: "desc" }, { startsAt: "asc" }],
      take: 60,
    }),
  ]);

  const sessions = weekSessions.map((session) =>
    toSessionView(session as unknown as SessionWithDetails)
  );
  const historyRows = monthSessions.map((session) =>
    toHistoryRow(session as unknown as SessionWithDetails)
  );

  const sessionsByDate = new Map<string, SessionView[]>();
  for (const session of sessions) {
    const list = sessionsByDate.get(session.date) ?? [];
    list.push(session);
    sessionsByDate.set(session.date, list);
  }

  const weekDays: WeekDayView[] = Array.from({ length: 7 }, (_, index) => {
    const date = addMalaysiaCalendarDays(weekStart, index);
    const iso = formatCalendarDate(date);
    const daySessions = sessionsByDate.get(iso) ?? [];

    return {
      date: iso,
      label: WEEKDAY_SHORT[getMalaysiaWeekday(date)] ?? "",
      day: date.getUTCDate(),
      isToday: iso === todayIso,
      isPast: iso < todayIso,
      savedCount: daySessions.filter((session) => session.saved).length,
      totalCount: daySessions.length,
    };
  });

  const perfectDays = (() => {
    const rowsByDate = new Map<string, HistoryRowView[]>();
    for (const row of historyRows) {
      const list = rowsByDate.get(row.date) ?? [];
      list.push(row);
      rowsByDate.set(row.date, list);
    }

    return Array.from(rowsByDate.values()).filter((rows) =>
      rows.every((row) => row.rate === 100)
    ).length;
  })();

  const historyStats: HistoryStatsView = {
    avgRate:
      historyRows.length > 0
        ? Math.round(
            historyRows.reduce((sum, row) => sum + row.rate, 0) /
              historyRows.length
          )
        : 0,
    totalSessions: historyRows.length,
    perfectDays,
    absentEvents: historyRows.reduce((sum, row) => sum + row.absent, 0),
    monthLabel: formatLongMonthYear(today),
  };

  return (
    <>
      <Header page="Attendance" pages={[`${appName}`]} />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
        <AttendanceView
          canMark={tenant.role === "TEACHER"}
          historyRows={historyRows}
          historyStats={historyStats}
          sessions={sessions}
          todayDate={todayIso}
          weekDays={weekDays}
        />
      </main>
    </>
  );
};

export default AttendancePage;
