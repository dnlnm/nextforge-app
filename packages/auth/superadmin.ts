import "server-only";

import { auth } from "./server";
import { isSuperadminUserId } from "./superadmin-shared";

export { isSuperadminUserId } from "./superadmin-shared";

export const requireSuperadmin = async () => {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  return isSuperadminUserId(session.userId)
    ? { authUserId: session.userId }
    : null;
};
