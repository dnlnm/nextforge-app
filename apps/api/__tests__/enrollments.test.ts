import { beforeEach, describe, expect, test, vi } from "vitest";

const { getUserMock, db } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  db: {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(db),
    auditEvent: { create: vi.fn() },
    enrollment: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    learningClass: { findFirst: vi.fn() },
    organizationMembership: { findFirst: vi.fn() },
    organizationSubscription: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    teacherProfile: { findFirst: vi.fn() },
  },
}));

vi.mock("@repo/api/context", () => ({
  createContext: (headers: Headers) => ({ headers }),
  createSupabaseClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@repo/database", () => ({
  database: db,
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
  email: "admin@klio.my",
  user_metadata: { activeOrganizationId: "org-1" },
};

const defaultMembership = {
  id: "membership-1",
  organizationId: "org-1",
  role: "ADMIN",
  userId: "user-1",
};

const defaultSubscription = {
  id: "subscription-1",
  plan: "STARTER",
  status: "TRIALING",
  trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

describe("enrollments router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: defaultUser }, error: null });
    db.organizationMembership.findFirst.mockResolvedValue(defaultMembership);
    db.organizationSubscription.findFirst.mockResolvedValue(
      defaultSubscription
    );
  });

  test("enroll creates an enrollment and writes an event", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({
      capacity: 30,
      name: "Physics Form 4",
    });
    db.enrollment.count.mockResolvedValue(12);
    db.enrollment.findFirst.mockResolvedValue(null);
    db.enrollment.create.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const caller = createCaller(withAuth());
    const result = await caller.enrollments.enroll({
      classId: "class-1",
      studentId: "student-1",
    });

    expect(result).toEqual({ enrollmentId: "enrollment-1" });
    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          classId: "class-1",
          organizationId: "org-1",
          studentId: "student-1",
        }),
      })
    );
    expect(db.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            eventType: "enrollment.created",
          }),
          targetId: "student-1",
        }),
      })
    );
  });

  test("enroll rejects enrollment into a full class with BAD_REQUEST", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 20 });
    db.enrollment.count.mockResolvedValue(20);

    const caller = createCaller(withAuth());
    await expect(
      caller.enrollments.enroll({
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("enroll rejects a duplicate enrollment", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(5);
    db.enrollment.findFirst.mockResolvedValue({ id: "existing" });

    const caller = createCaller(withAuth());
    await expect(
      caller.enrollments.enroll({
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "This student is already enrolled in the class.",
    });
  });

  test("enroll scopes queries to the organization", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(5);
    db.enrollment.findFirst.mockResolvedValue(null);
    db.enrollment.create.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const caller = createCaller(withAuth());
    await caller.enrollments.enroll({
      classId: "class-1",
      studentId: "student-1",
    });

    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
    expect(db.learningClass.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });

  test("end ends an enrollment idempotently", async () => {
    db.enrollment.findFirst.mockResolvedValue({
      archivedAt: null,
      class: { name: "Maths" },
      id: "enrollment-1",
      status: "ACTIVE",
      student: { fullName: "Aminah", id: "student-1" },
    });
    db.enrollment.update.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const caller = createCaller(withAuth());
    const result = await caller.enrollments.end({
      enrollmentId: "enrollment-1",
    });

    expect(result).toEqual({ ok: true });
    expect(db.enrollment.update).toHaveBeenCalledWith({
      where: { id: "enrollment-1" },
      data: { endsOn: expect.any(Date), status: "ENDED" },
    });
  });

  test("TEACHER cannot mutate enrollments", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      ...defaultMembership,
      role: "TEACHER",
    });

    const caller = createCaller(withAuth());
    await expect(
      caller.enrollments.enroll({
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("org A cannot enroll for org B (cross-tenant)", async () => {
    db.organizationMembership.findFirst.mockResolvedValue({
      ...defaultMembership,
      organizationId: "org-2",
    });
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(5);
    db.enrollment.findFirst.mockResolvedValue(null);
    db.enrollment.create.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const caller = createCaller(withAuth());
    await caller.enrollments.enroll({
      classId: "class-x",
      studentId: "student-x",
    });

    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-2" }),
      })
    );
    expect(db.learningClass.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-2" }),
      })
    );
    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-2" }),
      })
    );
  });

  test("bulkEnroll reports per-student results", async () => {
    db.student.findFirst.mockResolvedValueOnce({ fullName: "A" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(1);
    db.enrollment.create.mockResolvedValue({ id: "e-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    db.student.findFirst.mockResolvedValueOnce({ fullName: "B" });
    db.enrollment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing" });

    const caller = createCaller(withAuth());
    const result = await caller.enrollments.bulkEnroll({
      classId: "class-1",
      studentIds: ["student-1", "student-2"],
    });

    expect(result.enrolledCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.failed).toHaveLength(0);
  });
});
