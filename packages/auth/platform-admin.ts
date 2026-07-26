import "server-only";

import { auth } from "./server";

const getPlatformAdminUserIds = () =>
  (process.env.TLAS_PLATFORM_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((userId) => userId.trim())
    .filter(Boolean);

export const isPlatformAdminUserId = (userId: string) =>
  getPlatformAdminUserIds().includes(userId);

export const requirePlatformAdmin = async () => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn() as never;
  }

  return isPlatformAdminUserId(session.userId)
    ? { clerkUserId: session.userId }
    : null;
};
