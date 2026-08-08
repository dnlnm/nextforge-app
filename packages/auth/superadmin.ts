import "server-only";

import { auth } from "./server";

const getSuperadminUserIds = () =>
  (
    process.env.KLIO_SUPERADMIN_USER_IDS ??
    process.env.TLAS_SUPERADMIN_USER_IDS ??
    ""
  )
    .split(",")
    .map((userId) => userId.trim())
    .filter(Boolean);

export const isSuperadminUserId = (userId: string) =>
  getSuperadminUserIds().includes(userId);

export const requireSuperadmin = async () => {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  return isSuperadminUserId(session.userId)
    ? { authUserId: session.userId }
    : null;
};
