import { beforeAll, describe, expect, test, vi } from "vitest";

/**
 * Real-database tenant-isolation suite.
 *
 * Runs the actual tRPC routers against a real PostgreSQL database, proving that
 * org A cannot read/write org B data with real rows (not mocked argument
 * shapes). Skipped unless `TEST_DATABASE_URL` is set.
 *
 * Setup:
 *   export TEST_DATABASE_URL="postgresql://..."; bunx prisma migrate deploy
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const hasTestDb = Boolean(testDatabaseUrl);

// Point the real `@repo/database` singleton at the test database before any
// import pulls it in. When no test DB is configured the suite is skipped and the
// (lazily-connecting) Prisma client is never queried.
if (hasTestDb) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SKIP_ENV_VALIDATION = "true";
}

const users = {
  "token-owner-a": {
    id: "auth-user-owner-a",
    email: "owner@a.klio.my",
    user_metadata: { activeOrganizationId: "org-a" },
  },
  "token-teacher-b": {
    id: "auth-user-teacher-b",
    email: "teacher@b.klio.my",
    user_metadata: { activeOrganizationId: "org-b" },
  },
  "token-rogue": {
    // Real member of org-a, but their session points at org-b.
    id: "auth-user-rogue",
    email: "rogue@a.klio.my",
    user_metadata: { activeOrganizationId: "org-b" },
  },
};

vi.mock("@repo/api/context", () => ({
  createContext: (headers: Headers) => ({ headers }),
  createSupabaseClient: () => ({
    auth: {
      getUser: (token: string) => {
        const user = (users as Record<string, unknown>)[token];
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: "invalid" } };
      },
    },
  }),
}));

vi.mock("server-only", () => ({}));

import { appRouter, createCallerFactory, createContext } from "@repo/api";
import { database } from "@repo/database";

const createCaller = createCallerFactory(appRouter);

const withAuth = (token: string) => {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  return createContext(headers);
};

interface Tx {
  attendanceRecord: { count: (args: unknown) => Promise<number> };
  classSession: { create: (args: unknown) => Promise<unknown> };
  enrollment: { create: (args: unknown) => Promise<unknown> };
  learningClass: { create: (args: unknown) => Promise<unknown> };
  organization: { upsert: (args: unknown) => Promise<unknown> };
  organizationMembership: { upsert: (args: unknown) => Promise<unknown> };
  organizationSubscription: { upsert: (args: unknown) => Promise<unknown> };
  student: { upsert: (args: unknown) => Promise<unknown> };
  subject: { create: (args: unknown) => Promise<unknown> };
  user: { upsert: (args: unknown) => Promise<unknown>; deleteMany: () => Promise<unknown> };
}

describe.skipIf(!hasTestDb)("tenant isolation (integration)", () => {
  beforeAll(async () => {
    // The test database must be migrated (`prisma migrate deploy`). Clean any
    // previous run before seeding.
    await database.user.deleteMany();
  });

  const seedOrg = async (
    tx: Tx,
    opts: {
      orgId: string;
      slug: string;
      userId: string;
      authUserId: string;
      role: "OWNER" | "ADMIN" | "TEACHER";
      studentFullName: string;
    }
  ) => {
    await tx.user.upsert({
      where: { authUserId: opts.authUserId },
      update: { authUserId: opts.authUserId },
      create: { id: opts.userId, authUserId: opts.authUserId },
    });
    await tx.organization.upsert({
      where: { slug: opts.slug },
      update: { slug: opts.slug },
      create: { id: opts.orgId, name: opts.slug, slug: opts.slug },
    });
    await tx.organizationSubscription.upsert({
      where: { organizationId: opts.orgId },
      update: { organizationId: opts.orgId },
      create: {
        id: `sub-${opts.orgId}`,
        organizationId: opts.orgId,
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await tx.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: opts.orgId,
          userId: opts.userId,
        },
      },
      update: { organizationId: opts.orgId, userId: opts.userId },
      create: {
        id: `m-${opts.orgId}`,
        organizationId: opts.orgId,
        userId: opts.userId,
        role: opts.role,
        status: "ACTIVE",
      },
    });
    await tx.student.upsert({
      where: { id: `student-${opts.orgId}` },
      update: {},
      create: {
        id: `student-${opts.orgId}`,
        organizationId: opts.orgId,
        code: `STU0001-${opts.orgId}`,
        fullName: opts.studentFullName,
      },
    });
  };

  test("org A and org B can each see only their own students", async () => {
    await database.$transaction(async (tx) => {
      await seedOrg(tx as unknown as Tx, {
        orgId: "org-a",
        slug: "org-a-centre",
        userId: "user-a",
        authUserId: "auth-user-owner-a",
        role: "OWNER",
        studentFullName: "Student A",
      });
      await seedOrg(tx as unknown as Tx, {
        orgId: "org-b",
        slug: "org-b-centre",
        userId: "user-b",
        authUserId: "auth-user-teacher-b",
        role: "TEACHER",
        studentFullName: "Student B",
      });
    });

    const callerA = createCaller(withAuth("token-owner-a"));
    const callerB = createCaller(withAuth("token-teacher-b"));

    const resultA = await callerA.students.list({ page: 1, pageSize: 50 });
    const resultB = await callerB.students.list({ page: 1, pageSize: 50 });

    expect(resultA.data.map((s: { fullName: string }) => s.fullName)).toEqual([
      "Student A",
    ]);
    expect(resultB.data.map((s: { fullName: string }) => s.fullName)).toEqual([
      "Student B",
    ]);
  });

  test("a session pointing at an unjoined org is rejected", async () => {
    const caller = createCaller(withAuth("token-rogue"));
    await expect(
      caller.students.list({ page: 1, pageSize: 10 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("org A cannot mark attendance for org B's session", async () => {
    await database.$transaction(async (tx) => {
      const orgB = await tx.organization.upsert({
        where: { slug: "org-b-centre" },
        update: { slug: "org-b-centre" },
        create: {
          id: "org-b-att",
          name: "org-b-att",
          slug: "org-b-att-centre",
        },
      });
      await tx.subject.create({
        data: {
          id: "subject-org-b",
          organizationId: (orgB as { id: string }).id,
          name: "Math",
          code: "MATH",
        },
      });
      const classB = await tx.learningClass.create({
        data: {
          id: "class-org-b",
          organizationId: (orgB as { id: string }).id,
          subjectId: "subject-org-b",
          code: "MATH-B",
          name: "Math B",
          academicYear: 2026,
          startsOn: new Date(),
        },
      });
      const sessionB = await tx.classSession.create({
        data: {
          id: "session-org-b",
          organizationId: (orgB as { id: string }).id,
          classId: (classB as { id: string }).id,
          sessionDate: new Date(),
          startsAt: "09:00",
          endsAt: "10:00",
        },
      });
      await tx.enrollment.create({
        data: {
          id: "enroll-org-b",
          organizationId: (orgB as { id: string }).id,
          studentId: "student-org-b",
          classId: (classB as { id: string }).id,
          status: "ACTIVE",
        },
      });

      const callerA = createCaller(withAuth("token-owner-a"));
      await expect(
        callerA.attendance.markAttendance({
          sessionId: (sessionB as { id: string }).id,
          records: [{ studentId: "student-org-b", status: "PRESENT" }],
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const records = await tx.attendanceRecord.count({
        where: { sessionId: (sessionB as { id: string }).id },
      });
      expect(records).toBe(0);
    });
  });
});
