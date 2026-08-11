import { beforeEach, describe, expect, test, vi } from "vitest";

const { getUserMock, db } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  db: {
    organizationMembership: { findFirst: vi.fn(), findMany: vi.fn() },
    organizationSubscription: { findFirst: vi.fn(), upsert: vi.fn() },
    teacherInvitation: { count: vi.fn() },
    adminInvitation: { count: vi.fn() },
    invoice: { count: vi.fn() },
    organization: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    user: { findFirst: vi.fn(), upsert: vi.fn() },
    teacherProfile: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    subject: { findFirst: vi.fn(), findMany: vi.fn() },
    level: { findFirst: vi.fn(), findMany: vi.fn() },
    room: { findFirst: vi.fn() },
    classSchedule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    classSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    learningClass: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    attendanceRecord: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    guardian: { create: vi.fn(), updateMany: vi.fn() },
    studentGuardian: { create: vi.fn() },
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
    teacherInvitation: db.teacherInvitation,
    adminInvitation: db.adminInvitation,
    invoice: db.invoice,
    organization: db.organization,
    user: db.user,
    teacherProfile: db.teacherProfile,
    subject: db.subject,
    level: db.level,
    room: db.room,
    classSchedule: db.classSchedule,
    classSession: db.classSession,
    learningClass: db.learningClass,
    attendanceRecord: db.attendanceRecord,
    student: db.student,
    enrollment: db.enrollment,
    guardian: db.guardian,
    studentGuardian: db.studentGuardian,
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

const subscription = {
  id: "subscription-1",
  plan: "TRIAL",
  status: "TRIALING",
  trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

const users = {
  "token-a": {
    id: "auth-user-a",
    email: "owner@a.klio.my",
    user_metadata: { activeOrganizationId: "org-a" },
  },
  "token-b": {
    id: "auth-user-b",
    email: "teacher@b.klio.my",
    user_metadata: { activeOrganizationId: "org-b" },
  },
  "token-rogue": {
    // A member of org-a who points their session at org-b.
    id: "auth-user-rogue",
    email: "rogue@a.klio.my",
    user_metadata: { activeOrganizationId: "org-b" },
  },
};

const defaultUser = (token: string) => users[token as keyof typeof users];

describe("tenant isolation and authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockImplementation((token: string) => {
      const user = defaultUser(token);
      return user
        ? { data: { user }, error: null }
        : { data: { user: null }, error: { message: "invalid" } };
    });
  });

  describe("orgProcedure", () => {
    test("rejects a session whose activeOrganizationId points at an org the user does not belong to", async () => {
      // token-rogue is a member of org-a but activeOrganizationId = org-b.
      // The membership lookup (scoped to org-b) returns null => FORBIDDEN.
      db.organizationMembership.findFirst.mockResolvedValue(null);

      const caller = createCaller(withAuth("token-rogue"));
      await expect(
        caller.students.list({ page: 1, pageSize: 10 })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.organizationMembership.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organization: expect.objectContaining({ id: "org-b" }),
            user: expect.objectContaining({ authUserId: "auth-user-rogue" }),
          }),
        })
      );
    });

    test("allows a member of the active organization", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "OWNER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.student.findMany.mockResolvedValue([]);
      db.student.count.mockResolvedValue(0);

      const caller = createCaller(withAuth("token-a"));
      await expect(
        caller.students.list({ page: 1, pageSize: 10 })
      ).resolves.toBeDefined();
    });
  });

  describe("cross-tenant resource access", () => {
    test("markAttendance on a session in another org returns NOT_FOUND", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "OWNER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.teacherProfile.findFirst.mockResolvedValue(undefined);
      // Session belongs to org-b; caller operates in org-a.
      db.classSession.findFirst.mockResolvedValue(null);

      const caller = createCaller(withAuth("token-a"));
      await expect(
        caller.attendance.markAttendance({
          sessionId: "session-b",
          records: [{ studentId: "student-b", status: "PRESENT" }],
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      expect(db.classSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-a",
            id: "session-b",
          }),
        })
      );
    });

    test("students.list is scoped to the caller's organization", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "ADMIN",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.student.findMany.mockResolvedValue([
        { id: "student-a-1", fullName: "A" },
      ]);
      db.student.count.mockResolvedValue(1);

      const caller = createCaller(withAuth("token-a"));
      await caller.students.list({ page: 1, pageSize: 10 });

      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "org-a" }),
        })
      );
    });
  });

  describe("role authorization", () => {
    test("TEACHER cannot reach an OWNER-gated procedure", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "TEACHER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);

      const caller = createCaller(withAuth("token-a"));
      // today.createClassSession is ADMIN-gated; TEACHER must be rejected.
      await expect(
        caller.today.createClassSession({
          classId: "class-1",
          sessionDate: "2026-08-11",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("ADMIN can perform an ADMIN-gated procedure (but not owner SaaS)", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "ADMIN",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.learningClass.findFirst.mockResolvedValue({
        id: "class-1",
        organizationId: "org-a",
      });
      db.classSchedule.findFirst.mockResolvedValue({
        id: "schedule-1",
        classId: "class-1",
        dayOfWeek: "TUESDAY",
      });
      db.classSession.upsert.mockResolvedValue({ id: "session-1" });

      const caller = createCaller(withAuth("token-a"));
      await expect(
        caller.today.createClassSession({
          classId: "class-1",
          sessionDate: "2026-08-11",
        })
      ).resolves.toBeDefined();
    });
  });

  describe("teacher scoping (students.list)", () => {
    test("TEACHER only sees students in their own classes", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "TEACHER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.teacherProfile.findFirst.mockResolvedValue({
        id: "teacher-profile-1",
        fullName: "Ms Lim",
      });
      db.student.findMany.mockResolvedValue([]);
      db.student.count.mockResolvedValue(0);

      const caller = createCaller(withAuth("token-a"));
      await caller.students.list({ page: 1, pageSize: 10 });

      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enrollments: {
              some: {
                status: "ACTIVE",
                archivedAt: null,
                class: { teacherId: "teacher-profile-1" },
              },
            },
          }),
        })
      );
    });

    test("ADMIN sees all students (no enrolment filter)", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "ADMIN",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.student.findMany.mockResolvedValue([]);
      db.student.count.mockResolvedValue(0);

      const caller = createCaller(withAuth("token-a"));
      await caller.students.list({ page: 1, pageSize: 10 });

      const call = db.student.findMany.mock.calls[0][0];
      expect(call.where.enrollments).toBeUndefined();
    });
  });

  describe("workspace membership multiplicity", () => {
    test("same account can hold different roles in different orgs", async () => {
      // User is ADMIN in org-a and TEACHER in org-b. Switching org-b changes role.
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-b",
        organizationId: "org-b",
        role: "TEACHER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);

      const caller = createCaller(withAuth("token-rogue")); // activeOrganizationId org-b
      await expect(
        caller.today.createClassSession({
          classId: "class-1",
          sessionDate: "2026-08-11",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" }); // TEACHER blocked from ADMIN gate
    });
  });

  describe("classes router", () => {
    const adminContext = () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "ADMIN",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
    };

    test("create resolves a class code and creates schedules", async () => {
      adminContext();
      db.subject.findFirst.mockResolvedValue({ id: "subject-1", code: "MATH" });
      db.level.findFirst.mockResolvedValue({ id: "level-1", code: "GEN" });
      db.teacherProfile.findFirst.mockResolvedValue({
        id: "teacher-1",
        fullName: "Ms Lim",
      });
      db.room.findFirst.mockResolvedValue({ id: "room-1" });
      db.learningClass.findFirst.mockResolvedValue(null); // no code clash
      db.learningClass.findMany.mockResolvedValue([]); // no teacher conflicts
      db.learningClass.create.mockResolvedValue({ id: "class-1" });
      db.classSchedule.createMany.mockResolvedValue({ count: 1 });
      db.organizationSubscription.upsert.mockResolvedValue(subscription);
      db.student.count.mockResolvedValue(0);
      db.teacherProfile.count.mockResolvedValue(0);
      db.teacherInvitation.count.mockResolvedValue(0);
      db.learningClass.count.mockResolvedValue(0);
      db.invoice.count.mockResolvedValue(0);

      const caller = createCaller(withAuth("token-a"));
      const result = await caller.classes.create({
        name: "Math Gen",
        academicYear: 2026,
        startDate: "2026-01-01",
        subjectId: "subject-1",
        levelId: "level-1",
        teacherId: "teacher-1",
        monthlyFeeSen: 5000,
        schedules: [
          {
            dayOfWeek: "MONDAY",
            startsAt: "09:00",
            endsAt: "10:00",
            roomId: "room-1",
          },
        ],
      });

      expect(result.classId).toBe("class-1");
      expect(db.learningClass.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: "MATH-GEN-26",
            organizationId: "org-a",
          }),
        })
      );
      expect(db.classSchedule.createMany).toHaveBeenCalledTimes(1);
    });

    test("list scopes classes to the organization", async () => {
      adminContext();
      db.learningClass.findMany.mockResolvedValue([
        { id: "class-1", name: "Math", _count: { enrollments: 3 } },
      ]);
      db.learningClass.count.mockResolvedValue(1);

      const caller = createCaller(withAuth("token-a"));
      const result = await caller.classes.list({ page: 0, pageSize: 10 });

      expect(result.totalCount).toBe(1);
      expect(db.learningClass.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "org-a" }),
        })
      );
    });

    test("TEACHER cannot create a class (ADMIN-only)", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "TEACHER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);

      const caller = createCaller(withAuth("token-a"));
      await expect(
        caller.classes.create({
          name: "Math",
          academicYear: 2026,
          startDate: "2026-01-01",
          subjectId: "subject-1",
          levelId: "level-1",
          teacherId: "teacher-1",
          monthlyFeeSen: 0,
          schedules: [
            {
              dayOfWeek: "MONDAY",
              startsAt: "09:00",
              endsAt: "10:00",
              roomId: "room-1",
            },
          ],
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("student write procedures", () => {
    const adminContext = () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "ADMIN",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.organization.update.mockResolvedValue({ studentCodeSequence: 5 });
    };

    test("create reserves a sequential code and links a primary guardian", async () => {
      adminContext();
      db.organizationSubscription.upsert.mockResolvedValue(subscription);
      db.student.count.mockResolvedValue(0);
      db.teacherProfile.count.mockResolvedValue(0);
      db.teacherInvitation.count.mockResolvedValue(0);
      db.learningClass.count.mockResolvedValue(0);
      db.invoice.count.mockResolvedValue(0);
      db.student.create.mockResolvedValue({ id: "student-1" });
      db.guardian.create.mockResolvedValue({ id: "guardian-1" });
      db.studentGuardian.create.mockResolvedValue({ id: "sg-1" });

      const caller = createCaller(withAuth("token-a"));
      const result = await caller.students.create({
        fullName: "Aminah Lim",
        gender: "FEMALE",
        guardianName: "Mrs Lim",
        guardianPhone: "0123456789",
        studentEmail: "aminah@example.com",
        sameAsStudentAddress: true,
        relationship: "FATHER",
      });

      expect(result.studentId).toBe("student-1");
      expect(db.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { studentCodeSequence: { increment: 1 } },
        })
      );
      expect(db.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: "STU0005",
            organizationId: "org-a",
          }),
        })
      );
      expect(db.studentGuardian.create).toHaveBeenCalledTimes(1);
    });

    test("archive a student also archives their enrollments", async () => {
      adminContext();
      db.student.updateMany.mockResolvedValue({ count: 1 });
      db.enrollment.updateMany.mockResolvedValue({ count: 1 });

      const caller = createCaller(withAuth("token-a"));
      await caller.students.archive({ studentId: "student-1" });

      expect(db.enrollment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: "student-1",
            organizationId: "org-a",
          }),
          data: expect.objectContaining({ status: "ARCHIVED" }),
        })
      );
    });
  });

  describe("attendance read procedures", () => {
    test("session returns roster with attendance status", async () => {
      db.organizationMembership.findFirst.mockResolvedValue({
        id: "membership-a",
        organizationId: "org-a",
        role: "TEACHER",
        userId: "user-a",
      });
      db.organizationSubscription.findFirst.mockResolvedValue(subscription);
      db.teacherProfile.findFirst.mockResolvedValue({
        id: "teacher-1",
        fullName: "Ms Lim",
      });
      db.classSession.findFirst.mockResolvedValue({
        id: "session-1",
        organizationId: "org-a",
        classId: "class-1",
        class: { id: "class-1", name: "Math", code: "MATH-GEN-26" },
        attendance: [
          { studentId: "student-1", status: "PRESENT", notes: null },
        ],
        _count: { attendance: 1 },
      });
      db.enrollment.findMany.mockResolvedValue([
        {
          id: "enroll-1",
          student: {
            id: "student-1",
            fullName: "Aminah",
            code: "STU0001",
            photoKey: null,
          },
        },
      ]);

      const caller = createCaller(withAuth("token-a"));
      const result = await caller.attendance.session({
        sessionId: "session-1",
      });

      expect(result.roster).toHaveLength(1);
      expect(result.roster[0].attendanceStatus).toBe("PRESENT");
    });
  });
});
