import { beforeEach, describe, expect, test, vi } from "vitest";

const { getUserMock, db } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  db: {
    organizationMembership: { findFirst: vi.fn(), findMany: vi.fn() },
    organizationSubscription: { findFirst: vi.fn() },
    teacherProfile: { findFirst: vi.fn(), findMany: vi.fn() },
    classSchedule: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    classSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    learningClass: { findFirst: vi.fn(), findMany: vi.fn() },
    attendanceRecord: { upsert: vi.fn() },
    student: { findMany: vi.fn(), count: vi.fn() },
    level: { findMany: vi.fn() },
  },
}));

vi.mock("@repo/api/context", () => ({
  createContext: (headers: Headers) => ({ headers }),
  createSupabaseClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(db),
    organizationMembership: db.organizationMembership,
    organizationSubscription: db.organizationSubscription,
    teacherProfile: db.teacherProfile,
    classSchedule: db.classSchedule,
    classSession: db.classSession,
    learningClass: db.learningClass,
    attendanceRecord: db.attendanceRecord,
    student: db.student,
    level: db.level,
  },
}));

vi.mock("server-only", () => ({}));

import { appRouter, createCallerFactory, createContext } from "@repo/api";

const createCaller = createCallerFactory(appRouter);

const withAuth = (token = "valid-token") => {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  return createContext(headers);
};

const defaultUser = {
  id: "auth-user-1",
  email: "teacher@klio.my",
  user_metadata: { activeOrganizationId: "org-1" },
};

const defaultMembership = {
  id: "membership-1",
  organizationId: "org-1",
  role: "TEACHER",
  userId: "user-1",
};

const defaultSubscription = {
  id: "subscription-1",
  plan: "TRIAL",
  status: "TRIALING",
  trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

describe("organizations router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: defaultUser }, error: null });
  });

  test("memberships works without an active organization", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { ...defaultUser, user_metadata: {} } },
      error: null,
    });
    db.organizationMembership.findMany.mockResolvedValue([
      {
        id: "membership-1",
        role: "TEACHER",
        organization: {
          id: "org-1",
          imageUrl: null,
          name: "KLIO Centre",
          slug: "klio-centre",
        },
      },
    ]);

    const caller = createCaller(withAuth());
    await expect(caller.organizations.memberships()).resolves.toHaveLength(1);
    expect(db.organizationMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "ACTIVE",
          organization: { status: "ACTIVE" },
          user: { archivedAt: null, authUserId: "auth-user-1" },
        },
      })
    );
  });

  test("validateSwitch returns an accessible active membership", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      id: "membership-2",
      role: "ADMIN",
      organization: {
        id: "org-2",
        imageUrl: null,
        name: "Second Centre",
        slug: "second-centre",
      },
    });

    const caller = createCaller(withAuth());
    await expect(
      caller.organizations.validateSwitch({ organizationId: "org-2" })
    ).resolves.toMatchObject({ role: "ADMIN" });
  });

  test("validateSwitch rejects an inaccessible organization", async () => {
    db.organizationMembership.findFirst.mockResolvedValue(null);

    const caller = createCaller(withAuth());
    await expect(
      caller.organizations.validateSwitch({ organizationId: "org-other" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("today router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: defaultUser }, error: null });
    db.organizationMembership.findFirst.mockResolvedValue(defaultMembership);
    db.organizationSubscription.findFirst.mockResolvedValue(
      defaultSubscription
    );
  });

  test("sessions returns today's class count and sessions for the teacher", async () => {
    db.teacherProfile.findFirst.mockResolvedValue({
      id: "teacher-1",
      fullName: "Ms Lim",
    });
    db.classSchedule.count.mockResolvedValue(4);
    db.classSession.findMany.mockResolvedValue([
      {
        id: "session-1",
        class: { id: "class-1", subject: { name: "Maths" } },
        attendance: [],
      },
    ]);

    const caller = createCaller(withAuth());
    const result = await caller.today.sessions({ date: "2026-08-10" });

    expect(result.todayClassCount).toBe(4);
    expect(result.date).toEqual(new Date("2026-08-10T00:00:00.000Z"));
    expect(result.sessions).toHaveLength(1);
    expect(db.classSchedule.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dayOfWeek: expect.any(String),
          class: expect.objectContaining({ teacherId: "teacher-1" }),
        }),
      })
    );
    expect(db.classSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });

  test("sessions falls back to the unassigned teacher filter when no profile exists", async () => {
    db.teacherProfile.findFirst.mockResolvedValue(null);

    const caller = createCaller(withAuth());
    await caller.today.sessions({});

    expect(db.classSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          class: { teacherId: "__unassigned_teacher__" },
        }),
      })
    );
  });

  test("createSessions upserts a session for every matching schedule", async () => {
    db.teacherProfile.findFirst.mockResolvedValue({
      id: "teacher-1",
      fullName: "Ms Lim",
    });
    db.classSchedule.findMany.mockResolvedValue([
      { classId: "class-1", endsAt: "11:00", startsAt: "09:00" },
      { classId: "class-2", endsAt: "15:00", startsAt: "13:00" },
    ]);
    db.classSession.upsert.mockResolvedValue({ id: "session-new" });

    const caller = createCaller(withAuth());
    const result = await caller.today.createSessions();

    expect(result).toEqual({ created: 2 });
    expect(db.classSession.upsert).toHaveBeenCalledTimes(2);
  });

  test("createClassSession rejects when the class does not belong to the org", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      ...defaultMembership,
      role: "ADMIN",
    });
    db.learningClass.findFirst.mockResolvedValue(null);

    const caller = createCaller(withAuth());
    await expect(
      caller.today.createClassSession({
        classId: "class-x",
        sessionDate: "2026-08-10",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("createClassSession rejects when no schedule exists for the day", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      ...defaultMembership,
      role: "ADMIN",
    });
    db.learningClass.findFirst.mockResolvedValue({ id: "class-1" });
    db.classSchedule.findFirst.mockResolvedValue(null);

    const caller = createCaller(withAuth());
    await expect(
      caller.today.createClassSession({
        classId: "class-1",
        sessionDate: "2026-08-10",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("createClassSession upserts with schedule times", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      ...defaultMembership,
      role: "ADMIN",
    });
    db.learningClass.findFirst.mockResolvedValue({ id: "class-1" });
    db.classSchedule.findFirst.mockResolvedValue({
      endsAt: "11:00",
      startsAt: "09:00",
    });
    db.classSession.upsert.mockResolvedValue({ id: "session-1" });

    const caller = createCaller(withAuth());
    const result = await caller.today.createClassSession({
      classId: "class-1",
      sessionDate: "2026-08-10",
    });

    expect(result).toEqual({ ok: true });
    expect(db.classSession.upsert).toHaveBeenCalledWith({
      where: {
        classId_sessionDate: {
          classId: "class-1",
          sessionDate: new Date("2026-08-10T00:00:00.000Z"),
        },
      },
      create: expect.objectContaining({
        classId: "class-1",
        startsAt: "09:00",
        endsAt: "11:00",
        organizationId: "org-1",
      }),
      update: { endsAt: "11:00", startsAt: "09:00" },
    });
  });

  test("createClassSession rejects a TEACHER for an ADMIN-only procedure", async () => {
    const caller = createCaller(withAuth());
    await expect(
      caller.today.createClassSession({
        classId: "class-1",
        sessionDate: "2026-08-10",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("attendance router", () => {
  const session = {
    id: "session-1",
    class: {
      enrollments: [
        { studentId: "student-1" },
        { studentId: "student-2" },
        { studentId: "student-3" },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: defaultUser }, error: null });
    db.organizationMembership.findFirst.mockResolvedValue(defaultMembership);
    db.organizationSubscription.findFirst.mockResolvedValue(
      defaultSubscription
    );
    db.teacherProfile.findFirst.mockResolvedValue({
      id: "teacher-1",
      fullName: "Ms Lim",
    });
    db.classSession.findFirst.mockResolvedValue(session);
    db.attendanceRecord.upsert.mockResolvedValue({ id: "record-1" });
    db.classSession.update.mockResolvedValue({ id: "session-1" });
  });

  test("markAttendance upserts records only for enrolled students", async () => {
    const caller = createCaller(withAuth());
    const result = await caller.attendance.markAttendance({
      sessionId: "session-1",
      records: [
        { studentId: "student-1", status: "PRESENT" },
        { studentId: "student-2", status: "ABSENT" },
        { studentId: "student-999", status: "PRESENT" },
      ],
    });

    expect(result).toEqual({ ok: true });
    expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(db.classSession.update).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { status: "COMPLETED" },
    });
  });

  test("markAttendance rejects when the session is not found or not the teacher's", async () => {
    db.classSession.findFirst.mockResolvedValue(null);

    const caller = createCaller(withAuth());
    await expect(
      caller.attendance.markAttendance({
        sessionId: "session-999",
        records: [{ studentId: "student-1", status: "PRESENT" }],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("markAttendance scopes session lookup to the organization", async () => {
    const caller = createCaller(withAuth());
    await caller.attendance.markAttendance({
      sessionId: "session-1",
      records: [{ studentId: "student-1", status: "PRESENT" }],
    });

    expect(db.classSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });

  test("markSessionAttendanceStatus marks every enrolled student", async () => {
    const caller = createCaller(withAuth());
    const result = await caller.attendance.markSessionAttendanceStatus({
      sessionId: "session-1",
      status: "PRESENT",
    });

    expect(result).toEqual({ ok: true });
    expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(3);
    expect(db.attendanceRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          studentId: "student-1",
          status: "PRESENT",
        }),
      })
    );
  });
});

describe("students router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: defaultUser }, error: null });
    db.organizationMembership.findFirst.mockResolvedValue(defaultMembership);
    db.organizationSubscription.findFirst.mockResolvedValue(
      defaultSubscription
    );
    db.student.findMany.mockResolvedValue([
      {
        id: "student-1",
        fullName: "Aminah",
        branch: null,
        level: null,
        enrollments: [],
        guardians: [],
      },
    ]);
    db.student.count.mockResolvedValue(1);
  });

  test("list returns students and total count scoped to the org", async () => {
    const caller = createCaller(withAuth());
    const result = await caller.students.list({
      page: 0,
      pageSize: 20,
    });

    expect(result.totalCount).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(db.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
        orderBy: [{ fullName: "asc" }],
        skip: 0,
        take: 20,
      })
    );
  });

  test("list applies search and status/class filters", async () => {
    const caller = createCaller(withAuth());
    await caller.students.list({
      page: 1,
      pageSize: 10,
      search: "lim",
      filters: [{ id: "status", value: "ACTIVE" }],
    });

    expect(db.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          archivedAt: null,
        }),
        skip: 10,
        take: 10,
      })
    );
  });

  test("filterOptions maps classes, teachers and levels", async () => {
    db.learningClass.findMany.mockResolvedValue([
      { id: "class-1", name: "Maths" },
    ]);
    db.teacherProfile.findMany.mockResolvedValue([
      { id: "teacher-1", fullName: "Ms Lim" },
    ]);
    db.level.findMany.mockResolvedValue([
      { id: "level-1", name: "Form 4", order: 1 },
    ]);

    const caller = createCaller(withAuth());
    const result = await caller.students.filterOptions();

    expect(result).toEqual({
      classes: [{ label: "Maths", value: "class-1" }],
      levels: [{ label: "Form 4", value: "Form 4" }],
      tutors: [{ label: "Ms Lim", value: "teacher-1" }],
      statuses: [
        { label: "Active", value: "ACTIVE" },
        { label: "Archived", value: "ARCHIVED" },
      ],
    });
  });
});
