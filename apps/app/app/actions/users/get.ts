"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";

const colors = [
  "var(--color-red-500)",
  "var(--color-orange-500)",
  "var(--color-amber-500)",
  "var(--color-yellow-500)",
  "var(--color-lime-500)",
  "var(--color-green-500)",
  "var(--color-emerald-500)",
  "var(--color-teal-500)",
  "var(--color-cyan-500)",
  "var(--color-sky-500)",
  "var(--color-blue-500)",
  "var(--color-indigo-500)",
  "var(--color-violet-500)",
  "var(--color-purple-500)",
  "var(--color-fuchsia-500)",
  "var(--color-pink-500)",
  "var(--color-rose-500)",
];

export const getUsers = async (
  userIds: string[]
): Promise<
  | {
      data: Liveblocks["UserMeta"]["info"][];
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
      where: {
        organizationId: orgId,
        status: "ACTIVE",
        user: { authUserId: { in: userIds } },
      },
      select: {
        user: {
          select: {
            authUserId: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            email: true,
          },
        },
      },
    });
    const data: Liveblocks["UserMeta"]["info"][] = members.map(({ user }) => ({
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email ||
        "Unknown user",
      picture: user.imageUrl ?? "",
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    return { data };
  } catch (error) {
    return { error };
  }
};
