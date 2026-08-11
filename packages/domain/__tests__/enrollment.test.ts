import { beforeEach, describe, expect, test, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(db),
    auditEvent: { create: vi.fn() },
    enrollment: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    learningClass: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@repo/database", () => ({
  database: db,
}));

import type { PrismaClient } from "@repo/database";
import {
  bulkEnrollStudents,
  EnrollmentValidationError,
  endEnrollment,
  enrollStudent,
  transferStudent,
  updateEnrollment,
} from "../classes/enrollment";

const database = db as unknown as PrismaClient;

const ctx = { organizationId: "org-1", userId: "user-1" };

const fullError = /full/;
const notFoundError = /not found/;
const sourceEnrollmentError = /source enrollment/;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("enrollStudent", () => {
  test("enrolls a student and writes an activity event in a transaction", async () => {
    db.student.findFirst.mockResolvedValue({
      fullName: "Aminah",
    });
    db.learningClass.findFirst.mockResolvedValue({
      capacity: 30,
      name: "Physics Form 4",
    });
    db.enrollment.count.mockResolvedValue(12);
    db.enrollment.findFirst.mockResolvedValue(null);
    db.enrollment.create.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const result = await enrollStudent(database, ctx, {
      classId: "class-1",
      studentId: "student-1",
    });

    expect(result).toEqual({
      enrollmentId: "enrollment-1",
      studentId: "student-1",
    });
    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          classId: "class-1",
          studentId: "student-1",
        }),
      })
    );
    expect(db.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            eventType: "enrollment.created",
          }),
          targetId: "student-1",
          targetType: "Student",
        }),
      })
    );
  });

  test("rejects enrollment into a full class", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 20 });
    db.enrollment.count.mockResolvedValue(20);

    await expect(
      enrollStudent(database, ctx, {
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toThrow(fullError);
  });

  test("rejects an already-enrolled student", async () => {
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(5);
    db.enrollment.findFirst.mockResolvedValue({ id: "existing" });

    await expect(
      enrollStudent(database, ctx, {
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toThrow(EnrollmentValidationError);
  });

  test("rejects an archived or missing student", async () => {
    db.student.findFirst.mockResolvedValue(null);

    await expect(
      enrollStudent(database, ctx, {
        classId: "class-1",
        studentId: "student-1",
      })
    ).rejects.toThrow(notFoundError);
  });
});

describe("bulkEnrollStudents", () => {
  test("reports enrolled, skipped, and failed per student", async () => {
    db.student.findFirst.mockResolvedValueOnce({ fullName: "A" });
    db.learningClass.findFirst.mockResolvedValue({ capacity: 30 });
    db.enrollment.count.mockResolvedValue(1);
    db.enrollment.create.mockResolvedValue({ id: "e-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    db.student.findFirst.mockResolvedValueOnce({ fullName: "B" });
    db.enrollment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing" });

    const results = await bulkEnrollStudents(database, ctx, {
      classId: "class-1",
      studentIds: ["student-1", "student-2"],
    });

    expect(results).toEqual([
      { status: "enrolled", studentId: "student-1" },
      {
        message: "This student is already enrolled in the class.",
        status: "skipped",
        studentId: "student-2",
      },
    ]);
  });
});

describe("transferStudent", () => {
  test("ends the source and creates the destination atomically", async () => {
    const source = {
      archivedAt: null,
      class: { name: "Maths Form 4" },
      customFeeSen: 15_000,
      id: "source-1",
      status: "ACTIVE",
      student: { fullName: "Aminah", id: "student-1" },
    };

    db.enrollment.findFirst
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(null);
    db.student.findFirst.mockResolvedValue({ fullName: "Aminah" });
    db.learningClass.findFirst.mockResolvedValue({
      capacity: 30,
      name: "Add Maths",
    });
    db.enrollment.count.mockResolvedValue(10);
    db.enrollment.update.mockResolvedValue({ id: "source-1" });
    db.enrollment.create.mockResolvedValue({ id: "destination-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    const result = await transferStudent(database, ctx, {
      destinationClassId: "class-2",
      sourceEnrollmentId: "source-1",
    });

    expect(result).toEqual({ enrollmentId: "destination-1" });
    expect(db.enrollment.update).toHaveBeenCalledWith({
      where: { id: "source-1" },
      data: { endsOn: expect.any(Date), status: "ENDED" },
    });
    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          classId: "class-2",
          customFeeSen: 15_000,
          studentId: "student-1",
        }),
      })
    );
    expect(db.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            eventType: "enrollment.transferred",
          }),
        }),
      })
    );
  });

  test("rejects when the source enrollment is not active", async () => {
    db.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      transferStudent(database, ctx, {
        destinationClassId: "class-2",
        sourceEnrollmentId: "source-1",
      })
    ).rejects.toThrow(sourceEnrollmentError);
  });
});

describe("updateEnrollment", () => {
  test("updates custom fee and start date", async () => {
    db.enrollment.updateMany.mockResolvedValue({ count: 1 });

    await updateEnrollment(database, ctx, {
      customFeeSen: 12_000,
      enrollmentId: "enrollment-1",
      startsOn: "2026-09-01",
    });

    expect(db.enrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });
});

describe("endEnrollment", () => {
  test("ends an active enrollment and writes an event", async () => {
    db.enrollment.findFirst.mockResolvedValue({
      archivedAt: null,
      class: { name: "Maths" },
      id: "enrollment-1",
      status: "ACTIVE",
      student: { fullName: "Aminah", id: "student-1" },
    });
    db.enrollment.update.mockResolvedValue({ id: "enrollment-1" });
    db.auditEvent.create.mockResolvedValue({ id: "event-1" });

    await endEnrollment(database, ctx, { enrollmentId: "enrollment-1" });

    expect(db.enrollment.update).toHaveBeenCalledWith({
      where: { id: "enrollment-1" },
      data: { endsOn: expect.any(Date), status: "ENDED" },
    });
  });

  test("is idempotent for already-ended enrollments", async () => {
    db.enrollment.findFirst.mockResolvedValue({
      archivedAt: null,
      class: { name: "Maths" },
      id: "enrollment-1",
      status: "ENDED",
      student: { fullName: "Aminah", id: "student-1" },
    });

    await endEnrollment(database, ctx, { enrollmentId: "enrollment-1" });

    expect(db.enrollment.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});
