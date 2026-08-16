import "server-only";

import type { AuditAction, Prisma, PrismaClient } from "@repo/database";
import { formatMoneyRm } from "@repo/money";

export const EVENT_TYPES = {
  studentCreated: "student.created",
  studentArchived: "student.archived",
  studentRestored: "student.restored",
  enrollmentCreated: "enrollment.created",
  enrollmentEnded: "enrollment.ended",
  enrollmentTransferred: "enrollment.transferred",
  attendanceMarked: "attendance.marked",
  invoiceGenerated: "invoice.generated",
  paymentRecorded: "payment.recorded",
  paymentReversed: "payment.reversed",
} as const;

export type StudentEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface ActivityEventInput {
  readonly action: AuditAction;
  readonly metadata: Prisma.InputJsonValue;
  readonly organizationId: string;
  readonly summary: string;
  readonly targetId: string;
  readonly targetType: string;
  readonly userId?: string | null;
}

export interface ActivityEventTarget {
  readonly eventType: StudentEventType;
  readonly id?: string;
  readonly name?: string;
}

/** Writes a structured audit event for a student target. */
export const writeActivityEvent = async (
  db:
    | Pick<PrismaClient, "auditEvent">
    | { auditEvent: PrismaClient["auditEvent"] },
  input: ActivityEventInput
): Promise<void> => {
  await db.auditEvent.create({
    data: {
      action: input.action,
      actorUserId: input.userId,
      metadata: input.metadata,
      organizationId: input.organizationId,
      summary: input.summary,
      targetId: input.targetId,
      targetType: "Student",
    },
  });
};

export const studentCreatedEvent = (
  organizationId: string,
  targetId: string,
  studentName: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "CREATE",
  metadata: {
    eventType: EVENT_TYPES.studentCreated,
    id: targetId,
    name: studentName,
  },
  organizationId,
  summary: `Student ${studentName} was created`,
  targetId,
  targetType: "Student",
  userId,
});

export const studentArchivedEvent = (
  organizationId: string,
  targetId: string,
  studentName: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "ARCHIVE",
  metadata: {
    eventType: EVENT_TYPES.studentArchived,
    id: targetId,
    name: studentName,
  },
  organizationId,
  summary: `Student ${studentName} was archived`,
  targetId,
  targetType: "Student",
  userId,
});

export const studentRestoredEvent = (
  organizationId: string,
  targetId: string,
  studentName: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "RESTORE",
  metadata: {
    eventType: EVENT_TYPES.studentRestored,
    id: targetId,
    name: studentName,
  },
  organizationId,
  summary: `Student ${studentName} was restored`,
  targetId,
  targetType: "Student",
  userId,
});

export const enrollmentCreatedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  className: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "UPDATE",
  metadata: {
    className,
    eventType: EVENT_TYPES.enrollmentCreated,
  },
  organizationId,
  summary: `Enrolled in ${className}`,
  targetId,
  targetType: "Student",
  userId,
});

export const enrollmentEndedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  className: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "UPDATE",
  metadata: {
    className,
    eventType: EVENT_TYPES.enrollmentEnded,
  },
  organizationId,
  summary: `Ended enrollment in ${className}`,
  targetId,
  targetType: "Student",
  userId,
});

export const enrollmentTransferredEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  sourceClassName: string,
  destinationClassName: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "UPDATE",
  metadata: {
    destinationClassName,
    eventType: EVENT_TYPES.enrollmentTransferred,
    sourceClassName,
  },
  organizationId,
  summary: `Transferred from ${sourceClassName} to ${destinationClassName}`,
  targetId,
  targetType: "Student",
  userId,
});

export const attendanceMarkedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  className: string,
  sessionDate: Date,
  sessionId: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "UPDATE",
  metadata: {
    className,
    eventType: EVENT_TYPES.attendanceMarked,
    sessionId,
    sessionDate: sessionDate.toISOString(),
  },
  organizationId,
  summary: `Attendance marked for ${className}`,
  targetId,
  targetType: "Student",
  userId,
});

export const invoiceGeneratedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  invoiceId: string,
  invoiceNumber: string,
  userId?: string | null
): ActivityEventInput => ({
  action: "CREATE",
  metadata: {
    eventType: EVENT_TYPES.invoiceGenerated,
    invoiceId,
    invoiceNumber,
  },
  organizationId,
  summary: `Invoice ${invoiceNumber} generated`,
  targetId,
  targetType: "Student",
  userId,
});

export const paymentRecordedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  paymentId: string,
  amountSen: number,
  userId?: string | null
): ActivityEventInput => ({
  action: "CREATE",
  metadata: {
    amountSen,
    eventType: EVENT_TYPES.paymentRecorded,
    paymentId,
  },
  organizationId,
  summary: `Payment of ${formatMoneyRm(amountSen)} recorded`,
  targetId,
  targetType: "Student",
  userId,
});

export const paymentReversedEvent = (
  organizationId: string,
  targetId: string,
  _studentName: string,
  paymentId: string,
  amountSen: number,
  userId?: string | null
): ActivityEventInput => ({
  action: "UPDATE",
  metadata: {
    amountSen,
    eventType: EVENT_TYPES.paymentReversed,
    paymentId,
  },
  organizationId,
  summary: `Payment of ${formatMoneyRm(amountSen)} reversed`,
  targetId,
  targetType: "Student",
  userId,
});

export const listStudentActivity = async (
  db: Pick<PrismaClient, "auditEvent">,
  organizationId: string,
  studentId: string,
  { limit = 50 }: { readonly limit?: number } = {}
) =>
  db.auditEvent.findMany({
    where: { organizationId, targetId: studentId, targetType: "Student" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      action: true,
      actor: { select: { email: true, firstName: true, lastName: true } },
      createdAt: true,
      id: true,
      metadata: true,
      summary: true,
      targetId: true,
    },
  });

export type StudentActivityItem = Awaited<
  ReturnType<typeof listStudentActivity>
>[number];
