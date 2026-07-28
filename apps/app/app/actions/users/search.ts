"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import Fuse from "fuse.js";

export const searchUsers = async (
  query: string
): Promise<
  | {
      data: string[];
    }
  | {
      error: unknown;
    }
> => {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      throw new Error("Not logged in");
    }

    const members = await database.organizationMembership.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: {
        user: {
          select: {
            authUserId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    const users = members.map(({ user }) => ({
      id: user.authUserId,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email ||
        user.authUserId,
    }));

    const fuse = new Fuse(users, {
      keys: ["name"],
      minMatchCharLength: 1,
      threshold: 0.3,
    });

    const results = fuse.search(query);
    const data = results.map((result) => result.item.id);

    return { data };
  } catch (error) {
    return { error };
  }
};
