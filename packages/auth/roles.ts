import type { MembershipRole } from "@repo/database";

export const tenantRoles = ["OWNER", "ADMIN", "TEACHER"] as const;

export type TenantRole = (typeof tenantRoles)[number];

const roleMap: Record<string, TenantRole> = {
  "org:admin": "ADMIN",
  "org:member": "TEACHER",
  admin: "ADMIN",
  member: "TEACHER",
  owner: "OWNER",
  teacher: "TEACHER",
};

export const normalizeRole = (role?: string | null): MembershipRole => {
  if (!role) {
    return "TEACHER";
  }

  return roleMap[role.toLowerCase()] ?? "TEACHER";
};

const roleRank: Record<TenantRole, number> = {
  TEACHER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const hasTenantRole = (
  actualRole: TenantRole,
  allowedRoles: readonly TenantRole[]
) => allowedRoles.some((role) => roleRank[actualRole] >= roleRank[role]);
