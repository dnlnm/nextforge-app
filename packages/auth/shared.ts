/**
 * React Native-safe entry point for `@repo/auth`.
 *
 * Only modules that are pure TypeScript (no `server-only`, no `next`, no
 * Prisma runtime) may be re-exported here. Everything else lives in
 * `@repo/auth/server`, `@repo/auth/client`, `@repo/auth/proxy`, etc.
 */
export * from "./domain";
export * from "./roles";
export * from "./slug-pure";
export type { TenantContext } from "./tenant-types";