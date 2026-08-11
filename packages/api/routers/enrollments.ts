import { database } from "@repo/database";
import {
  bulkEnrollStudents,
  EnrollmentValidationError,
  endEnrollment,
  enrollStudent,
  transferStudent,
  updateEnrollment,
} from "@repo/domain/classes/enrollment";
import {
  bulkEnrollStudentsInputSchema,
  endEnrollmentInputSchema,
  enrollStudentInputSchema,
  transferStudentInputSchema,
  updateEnrollmentInputSchema,
} from "@repo/schemas/enrollments";
import { roleProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

const toTRPCError = (error: unknown): never => {
  if (error instanceof EnrollmentValidationError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }

  throw error;
};

/** Enrollment workflow procedures shared by web, mobile, and future APIs. */
export const enrollmentsRouter = createTRPCRouter({
  /** Enroll a single student into a class with capacity and duplicate checks. */
  enroll: roleProcedure(["ADMIN"])
    .input(enrollStudentInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await enrollStudent(
          database,
          {
            organizationId: ctx.organizationId,
            userId: ctx.userId,
          },
          input
        );

        return { enrollmentId: result.enrollmentId };
      } catch (error) {
        return toTRPCError(error);
      }
    }),

  /** Enroll multiple students into one class, reporting per-student results. */
  bulkEnroll: roleProcedure(["ADMIN"])
    .input(bulkEnrollStudentsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const results = await bulkEnrollStudents(
        database,
        {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
        },
        {
          classId: input.classId,
          customFeeSen: input.customFeeSen,
          startsOn: input.startsOn,
          studentIds: input.studentIds,
        }
      );

      return {
        enrolledCount: results.filter((result) => result.status === "enrolled")
          .length,
        failed: results.filter((result) => result.status === "failed"),
        results,
        skippedCount: results.filter((result) => result.status === "skipped")
          .length,
      };
    }),

  /** Atomically transfer a student between classes. */
  transfer: roleProcedure(["ADMIN"])
    .input(transferStudentInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await transferStudent(
          database,
          {
            organizationId: ctx.organizationId,
            userId: ctx.userId,
          },
          input
        );

        return { enrollmentId: result.enrollmentId };
      } catch (error) {
        return toTRPCError(error);
      }
    }),

  /** Update an enrollment's custom fee or start date. */
  update: roleProcedure(["ADMIN"])
    .input(updateEnrollmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await updateEnrollment(
          database,
          {
            organizationId: ctx.organizationId,
            userId: ctx.userId,
          },
          input
        );

        return { ok: true };
      } catch (error) {
        return toTRPCError(error);
      }
    }),

  /** End an enrollment idempotently. */
  end: roleProcedure(["ADMIN"])
    .input(endEnrollmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await endEnrollment(
          database,
          {
            organizationId: ctx.organizationId,
            userId: ctx.userId,
          },
          input
        );

        return { ok: true };
      } catch (error) {
        return toTRPCError(error);
      }
    }),
});
