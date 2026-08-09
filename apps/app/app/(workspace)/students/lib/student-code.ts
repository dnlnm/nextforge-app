import type { Prisma } from "@repo/database";

export const reserveStudentCode = async (
  tx: Prisma.TransactionClient,
  organizationId: string
) => {
  const organization = await tx.organization.update({
    where: { id: organizationId },
    data: { studentCodeSequence: { increment: 1 } },
    select: { studentCodeSequence: true },
  });
  return `STU${String(organization.studentCodeSequence).padStart(4, "0")}`;
};
