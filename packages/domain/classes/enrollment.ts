import "server-only";

import type { PrismaClient } from "@repo/database";
import { capacityInfo } from "../metrics";

type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export interface EnrollmentContext {
  readonly organizationId: string;
  readonly userId?: string | null;
}

export interface EnrollInput {
  readonly classId: string;
  readonly customFeeSen?: number | null;
  readonly startsOn?: string | null;
  readonly studentId: string;
}

export interface BulkEnrollInput extends EnrollInput {
  readonly classId: string;
}

export interface TransferInput {
  readonly destinationClassId: string;
  readonly destinationCustomFeeSen?: number | null;
  readonly sourceEnrollmentId: string;
  readonly startsOn?: string | null;
}

export type BulkEnrollResult =
  | {
      readonly message?: string;
      readonly status: "enrolled";
      readonly studentId: string;
    }
  | {
      readonly message: string;
      readonly status: "failed";
      readonly studentId: string;
    }
  | {
      readonly message: string;
      readonly status: "skipped";
      readonly studentId: string;
    };

export class EnrollmentValidationError extends Error {}

const parseDate = (value?: string | null): Date => {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new EnrollmentValidationError("Enrollment start date is invalid.");
  }

  return date;
};

const assertClassAvailable = async (
  tx: TransactionClient,
  organizationId: string,
  classId: string,
  { classInfo }: { readonly classInfo?: { capacity: number | null } } = {}
): Promise<{ capacity: number | null }> => {
  const learningClass =
    classInfo ??
    (await tx.learningClass.findFirst({
      where: {
        archivedAt: null,
        id: classId,
        organizationId,
        status: "ACTIVE",
      },
      select: { capacity: true },
    }));

  if (!learningClass) {
    throw new EnrollmentValidationError("Class not found or is not active.");
  }

  const activeCount = await tx.enrollment.count({
    where: {
      archivedAt: null,
      classId,
      organizationId,
      status: "ACTIVE",
    },
  });

  const { isFull } = capacityInfo(activeCount, learningClass.capacity);

  if (isFull) {
    throw new EnrollmentValidationError(
      `This class is full (${activeCount}/${learningClass.capacity}).`
    );
  }

  return learningClass;
};

const assertStudentAvailable = async (
  tx: TransactionClient,
  organizationId: string,
  studentId: string
): Promise<{ fullName: string }> => {
  const student = await tx.student.findFirst({
    where: {
      archivedAt: null,
      id: studentId,
      organizationId,
      status: "ACTIVE",
    },
    select: { fullName: true },
  });

  if (!student) {
    throw new EnrollmentValidationError("Student not found or is not active.");
  }

  return student;
};

const assertNotDuplicated = async (
  tx: TransactionClient,
  organizationId: string,
  studentId: string,
  classId: string
): Promise<void> => {
  const existing = await tx.enrollment.findFirst({
    where: {
      archivedAt: null,
      classId,
      organizationId,
      status: "ACTIVE",
      studentId,
    },
    select: { id: true },
  });

  if (existing) {
    throw new EnrollmentValidationError(
      "This student is already enrolled in the class."
    );
  }
};

export interface EnrollmentResult {
  readonly enrollmentId: string;
  readonly studentId: string;
}

/** Enrolls a single student into a class with capacity and duplicate checks. */
export const enrollStudent = async (
  db: PrismaClient,
  ctx: EnrollmentContext,
  input: EnrollInput
): Promise<EnrollmentResult> => {
  if (!(input.studentId && input.classId)) {
    throw new EnrollmentValidationError("Student and class are required.");
  }

  try {
    return await db.$transaction(async (tx) => {
      const [_student, _learningClass] = await Promise.all([
        assertStudentAvailable(tx, ctx.organizationId, input.studentId),
        assertClassAvailable(tx, ctx.organizationId, input.classId),
      ]);

      await assertNotDuplicated(
        tx,
        ctx.organizationId,
        input.studentId,
        input.classId
      );

      const className = await tx.learningClass
        .findFirst({
          where: { id: input.classId, organizationId: ctx.organizationId },
          select: { name: true },
        })
        .then((c) => c?.name ?? "class");

      const enrollment = await tx.enrollment.create({
        data: {
          archivedAt: null,
          classId: input.classId,
          customFeeSen: input.customFeeSen ?? undefined,
          organizationId: ctx.organizationId,
          startsOn: parseDate(input.startsOn),
          status: "ACTIVE",
          studentId: input.studentId,
        },
        select: { id: true },
      });

      await tx.auditEvent.create({
        data: {
          action: "UPDATE",
          actorUserId: ctx.userId,
          metadata: {
            className,
            eventType: "enrollment.created",
          },
          organizationId: ctx.organizationId,
          summary: `Enrolled in ${className}`,
          targetId: input.studentId,
          targetType: "Student",
        },
      });

      return { enrollmentId: enrollment.id, studentId: input.studentId };
    });
  } catch (error) {
    if (error instanceof EnrollmentValidationError) {
      throw error;
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new EnrollmentValidationError(
        "This student is already enrolled in the class."
      );
    }

    throw error;
  }
};

/**
 * Enrolls multiple students into one class. Validates every candidate before
 * writing so no duplicate active enrollments are created; each candidate is
 * reported as enrolled, skipped, or failed.
 */
export const bulkEnrollStudents = async (
  db: PrismaClient,
  ctx: EnrollmentContext,
  input: Omit<EnrollInput, "studentId"> & {
    readonly studentIds: readonly string[];
  }
): Promise<BulkEnrollResult[]> => {
  if (input.studentIds.length === 0) {
    throw new EnrollmentValidationError("At least one student is required.");
  }

  const results: BulkEnrollResult[] = [];

  for (const studentId of input.studentIds) {
    try {
      const result = await enrollStudent(db, ctx, {
        classId: input.classId,
        customFeeSen: input.customFeeSen,
        startsOn: input.startsOn,
        studentId,
      });

      results.push({ status: "enrolled", studentId: result.studentId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Enrollment failed.";

      if (message.includes("already enrolled")) {
        results.push({ message, status: "skipped", studentId });
      } else {
        results.push({ message, status: "failed", studentId });
      }
    }
  }

  return results;
};

/**
 * Transfers a student between classes atomically: ends the source enrollment,
 * creates the destination enrollment, and records the transfer event in one
 * transaction. Preserves the source custom fee unless overridden.
 */
export const transferStudent = async (
  db: PrismaClient,
  ctx: EnrollmentContext,
  input: TransferInput
): Promise<{ enrollmentId: string }> => {
  if (!(input.sourceEnrollmentId && input.destinationClassId)) {
    throw new EnrollmentValidationError(
      "Source enrollment and destination class are required."
    );
  }

  return await db.$transaction(async (tx) => {
    const source = await tx.enrollment.findFirst({
      where: {
        archivedAt: null,
        id: input.sourceEnrollmentId,
        organizationId: ctx.organizationId,
        status: "ACTIVE",
      },
      include: {
        class: { select: { name: true } },
        student: { select: { fullName: true, id: true } },
      },
    });

    if (!source) {
      throw new EnrollmentValidationError(
        "Active source enrollment not found."
      );
    }

    await Promise.all([
      assertStudentAvailable(tx, ctx.organizationId, source.student.id),
      assertClassAvailable(tx, ctx.organizationId, input.destinationClassId),
    ]);

    await assertNotDuplicated(
      tx,
      ctx.organizationId,
      source.student.id,
      input.destinationClassId
    );

    const destinationName = await tx.learningClass
      .findFirst({
        where: {
          id: input.destinationClassId,
          organizationId: ctx.organizationId,
        },
        select: { name: true },
      })
      .then((c) => c?.name ?? "class");

    const now = new Date();

    await tx.enrollment.update({
      where: { id: source.id },
      data: { endsOn: now, status: "ENDED" },
    });

    const destination = await tx.enrollment.create({
      data: {
        archivedAt: null,
        classId: input.destinationClassId,
        customFeeSen:
          input.destinationCustomFeeSen ?? source.customFeeSen ?? undefined,
        organizationId: ctx.organizationId,
        startsOn: parseDate(input.startsOn),
        status: "ACTIVE",
        studentId: source.student.id,
      },
      select: { id: true },
    });

    await tx.auditEvent.create({
      data: {
        action: "UPDATE",
        actorUserId: ctx.userId,
        metadata: {
          destinationClassName: destinationName,
          eventType: "enrollment.transferred",
          sourceClassName: source.class.name,
        },
        organizationId: ctx.organizationId,
        summary: `Transferred from ${source.class.name} to ${destinationName}`,
        targetId: source.student.id,
        targetType: "Student",
      },
    });

    return { enrollmentId: destination.id };
  });
};

export const updateEnrollment = async (
  db: PrismaClient,
  ctx: EnrollmentContext,
  input: {
    readonly customFeeSen?: number | null;
    readonly enrollmentId: string;
    readonly startsOn?: string | null;
  }
): Promise<void> => {
  if (!input.enrollmentId) {
    throw new EnrollmentValidationError("Enrollment is required.");
  }

  const result = await db.enrollment.updateMany({
    where: { id: input.enrollmentId, organizationId: ctx.organizationId },
    data: {
      customFeeSen: input.customFeeSen ?? undefined,
      startsOn: input.startsOn ? parseDate(input.startsOn) : undefined,
    },
  });

  if (result.count === 0) {
    throw new EnrollmentValidationError("Enrollment not found.");
  }
};

/** Ends an enrollment idempotently. */
export const endEnrollment = async (
  db: PrismaClient,
  ctx: EnrollmentContext,
  input: { readonly enrollmentId: string }
): Promise<void> => {
  if (!input.enrollmentId) {
    throw new EnrollmentValidationError("Enrollment is required.");
  }

  await db.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: {
        id: input.enrollmentId,
        organizationId: ctx.organizationId,
      },
      include: {
        class: { select: { name: true } },
        student: { select: { fullName: true, id: true } },
      },
    });

    if (!enrollment) {
      throw new EnrollmentValidationError("Enrollment not found.");
    }

    if (enrollment.status === "ENDED" || enrollment.archivedAt !== null) {
      return;
    }

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { endsOn: new Date(), status: "ENDED" },
    });

    await tx.auditEvent.create({
      data: {
        action: "UPDATE",
        actorUserId: ctx.userId,
        metadata: {
          className: enrollment.class.name,
          eventType: "enrollment.ended",
        },
        organizationId: ctx.organizationId,
        summary: `Ended enrollment in ${enrollment.class.name}`,
        targetId: enrollment.student.id,
        targetType: "Student",
      },
    });
  });
};
