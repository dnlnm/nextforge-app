"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  bulkEnrollStudents,
  EnrollmentValidationError,
  endEnrollment,
  enrollStudent,
  transferStudent,
} from "@repo/domain/classes/enrollment";
import { revalidatePath } from "next/cache";

export interface EnrollmentActionResult {
  readonly error?: string;
  readonly ok?: boolean;
}

const revalidateAcademicPaths = () => {
  revalidatePath("/classes");
  revalidatePath("/students");
  revalidatePath("/enrollment");
  revalidatePath("/academics");
};

export const enrollStudentAction = async (input: {
  readonly classId: string;
  readonly customFeeSen?: number | null;
  readonly startsOn?: string | null;
  readonly studentId: string;
}): Promise<EnrollmentActionResult> => {
  const tenant = await requireTenantRole(["ADMIN"]);

  try {
    await enrollStudent(
      database,
      { organizationId: tenant.organizationId, userId: tenant.userId },
      input
    );
  } catch (error) {
    if (error instanceof EnrollmentValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidateAcademicPaths();

  return { ok: true };
};

export const bulkEnrollStudentsAction = async (input: {
  readonly classId: string;
  readonly customFeeSen?: number | null;
  readonly startsOn?: string | null;
  readonly studentIds: string[];
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);

  const results = await bulkEnrollStudents(
    database,
    { organizationId: tenant.organizationId, userId: tenant.userId },
    input
  );

  revalidateAcademicPaths();

  return {
    enrolledCount: results.filter((result) => result.status === "enrolled")
      .length,
    failed: results.filter((result) => result.status === "failed"),
    results,
    skippedCount: results.filter((result) => result.status === "skipped")
      .length,
  };
};

export const transferStudentAction = async (input: {
  readonly destinationClassId: string;
  readonly destinationCustomFeeSen?: number | null;
  readonly sourceEnrollmentId: string;
  readonly startsOn?: string | null;
}): Promise<EnrollmentActionResult> => {
  const tenant = await requireTenantRole(["ADMIN"]);

  try {
    await transferStudent(
      database,
      { organizationId: tenant.organizationId, userId: tenant.userId },
      input
    );
  } catch (error) {
    if (error instanceof EnrollmentValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidateAcademicPaths();

  return { ok: true };
};

export const endEnrollmentAction = async (input: {
  readonly enrollmentId: string;
}): Promise<EnrollmentActionResult> => {
  const tenant = await requireTenantRole(["ADMIN"]);

  try {
    await endEnrollment(
      database,
      { organizationId: tenant.organizationId, userId: tenant.userId },
      input
    );
  } catch (error) {
    if (error instanceof EnrollmentValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidateAcademicPaths();

  return { ok: true };
};
