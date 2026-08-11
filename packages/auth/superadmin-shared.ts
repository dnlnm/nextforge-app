/**
 * Pure (React Native-safe) superadmin helpers. Kept separate from `superadmin.ts`
 * so server-only code (Supabase SSR) is not pulled into RN/API bundles.
 */
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
