import { beforeEach, describe, expect, test, vi } from "vitest";

const { getUserMock, organizationMembershipFindFirstMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  organizationMembershipFindFirstMock: vi.fn(),
}));

vi.mock("@repo/api/context", () => ({
  createContext: (headers: Headers) => ({ headers }),
  createSupabaseClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

vi.mock("@repo/database", () => ({
  database: {
    organizationMembership: {
      findFirst: organizationMembershipFindFirstMock,
    },
  },
}));

vi.mock("server-only", () => ({}));

import {
  createCallerFactory,
  createContext,
  createTRPCRouter,
  orgProcedure,
  protectedProcedure,
  roleProcedure,
} from "@repo/api";

const createCaller = createCallerFactory(
  createTRPCRouter({
    me: protectedProcedure.query(({ ctx }) => ({
      authUserId: ctx.authUserId,
      authEmail: ctx.authEmail,
      orgId: ctx.orgId,
    })),
    org: orgProcedure.query(({ ctx }) => ({
      organizationId: ctx.organizationId,
      role: ctx.role,
      userId: ctx.userId,
    })),
    adminOnly: roleProcedure(["ADMIN"]).query(({ ctx }) => ctx.role),
  })
);

const withAuth = (options: { token?: string | null }) => {
  const headers = new Headers();

  if (options.token !== null && options.token !== undefined) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  return createContext(headers);
};

describe("API auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockImplementation(async (token: string) =>
      token === "valid-token"
        ? {
            data: {
              user: {
                id: "auth-user-1",
                email: "teacher@klio.my",
                user_metadata: { activeOrganizationId: "org-1" },
              },
            },
            error: null,
          }
        : { data: { user: null }, error: { message: "invalid" } }
    );
    organizationMembershipFindFirstMock.mockResolvedValue({
      id: "membership-1",
      organizationId: "org-1",
      role: "TEACHER",
      userId: "user-1",
    });
  });

  test("rejects requests without a bearer token", async () => {
    const caller = createCaller(withAuth({ token: null }));
    await expect(caller.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("rejects requests with an empty bearer token", async () => {
    const caller = createCaller(withAuth({ token: "   " }));
    await expect(caller.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("rejects requests with an invalid token", async () => {
    const caller = createCaller(withAuth({ token: "bad-token" }));
    await expect(caller.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("passes through the authenticated user", async () => {
    const caller = createCaller(withAuth({ token: "valid-token" }));
    await expect(caller.me()).resolves.toEqual({
      authUserId: "auth-user-1",
      authEmail: "teacher@klio.my",
      orgId: "org-1",
    });
  });

  test("rejects when the session has no active organization", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "auth-user-1", user_metadata: {} } },
      error: null,
    });
    const caller = createCaller(withAuth({ token: "valid-token" }));
    await expect(caller.org()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("rejects cross-tenant membership", async () => {
    organizationMembershipFindFirstMock.mockResolvedValueOnce(null);
    const caller = createCaller(withAuth({ token: "valid-token" }));
    await expect(caller.org()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("rejects insufficient role", async () => {
    const caller = createCaller(withAuth({ token: "valid-token" }));
    await expect(caller.adminOnly()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("allows sufficient role", async () => {
    organizationMembershipFindFirstMock.mockResolvedValueOnce({
      id: "membership-1",
      organizationId: "org-1",
      role: "OWNER",
      userId: "user-1",
    });
    const caller = createCaller(withAuth({ token: "valid-token" }));
    await expect(caller.adminOnly()).resolves.toBe("OWNER");
  });
});
