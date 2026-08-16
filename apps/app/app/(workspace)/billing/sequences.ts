import type { Prisma } from "@repo/database";

export type SequenceKind = "INVOICE" | "RECEIPT";

/**
 * The subset of the Prisma client / transaction client that this helper needs.
 * `Prisma.TransactionClient` and the base `PrismaClient` are both structurally
 * compatible with this, so a helper can be called with either the shared
 * `database` client or a `$transaction` `tx`.
 */
interface SequenceClient {
  organizationSequence: {
    upsert(args: Prisma.OrganizationSequenceUpsertArgs): Promise<{
      value: number;
    }>;
  };
}

/**
 * Atomically reserves the next number for a per-organization sequence, using an
 * upsert that increments a dedicated counter row (`OrganizationSequence`).
 *
 * Using a counter row instead of `count(...) + 1` keeps numbers monotonic and
 * race-safe under concurrency: two simultaneous reservations always get
 * distinct values, and voided/rolled-back rows never reuse a number.
 *
 * Must be called inside the same transaction as the row being numbered so the
 * reservation and the create commit (or roll back) together.
 */
export const reserveNextSequence = async (
  db: SequenceClient,
  organizationId: string,
  kind: SequenceKind
): Promise<number> => {
  const { value } = await db.organizationSequence.upsert({
    where: {
      organizationId_kind: { kind, organizationId },
    },
    create: { kind, organizationId, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  return value;
};

export const formatSequenceNumber = (
  prefix: string,
  value: number,
  width = 5
): string => `${prefix}-${String(value).padStart(width, "0")}`;
