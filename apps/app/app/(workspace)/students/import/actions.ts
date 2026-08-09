"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type Prisma } from "@repo/database";
import {
  deletePrivateObject,
  getPrivateObject,
  headPrivateObject,
} from "@repo/storage";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimit } from "../../billing/limits";
import { reserveStudentCode } from "../lib/student-code";
import {
  IMPORT_BATCH_SIZE,
  MAX_IMPORT_BYTES,
  type NormalizedStudentRow,
  parseStudentWorkbook,
} from "./lib/workbook";

const publicFailure =
  "The import could not be processed. Check the workbook and try again.";

export const validateStudentImport = async (importId: string) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentImport = await database.studentImport.findFirst({
    where: {
      id: importId,
      organizationId: tenant.organizationId,
      status: "UPLOADED",
    },
  });
  if (!studentImport?.sourceKey) {
    return { error: "Import not found or already validated." };
  }
  await database.studentImport.update({
    where: { id: studentImport.id },
    data: {
      status: "VALIDATING",
      validationStartedAt: new Date(),
      failureMessage: null,
    },
  });
  try {
    const metadata = await headPrivateObject(studentImport.sourceKey);
    if (
      !(
        metadata.ContentLength &&
        metadata.ContentLength > 0 &&
        metadata.ContentLength <= MAX_IMPORT_BYTES
      )
    ) {
      throw new Error(
        "The uploaded workbook is empty or exceeds the 10 MiB limit."
      );
    }
    const object = await getPrivateObject(studentImport.sourceKey);
    if (!object.Body) {
      throw new Error("The uploaded workbook could not be read.");
    }
    const buffer = Buffer.from(await object.Body.transformToByteArray());
    const levels = await database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true, code: true, name: true },
    });
    const parsed = await parseStudentWorkbook({ buffer, levels });
    const validRows = parsed.rows.filter(
      (row) => row.status === "VALID"
    ).length;
    const invalidRows = parsed.rows.filter(
      (row) => row.status === "INVALID"
    ).length;
    const skippedRows = parsed.rows.filter(
      (row) => row.status === "DUPLICATE"
    ).length;
    await database.$transaction(async (tx) => {
      await tx.studentImportRow.deleteMany({
        where: { importId: studentImport.id },
      });
      await tx.studentImportRow.createMany({
        data: parsed.rows.map((row) => ({
          organizationId: tenant.organizationId,
          importId: studentImport.id,
          rowNumber: row.rowNumber,
          status: row.status,
          rawData: row.rawData as Prisma.InputJsonValue,
          normalizedData: row.normalized as Prisma.InputJsonValue | undefined,
          errors: row.errors as Prisma.InputJsonValue,
          fingerprint: row.fingerprint,
        })),
      });
      await tx.studentImport.update({
        where: { id: studentImport.id },
        data: {
          status: "READY",
          totalRows: parsed.rows.length,
          validRows,
          invalidRows,
          skippedRows,
          validatedAt: new Date(),
          sourceKey: null,
          failureMessage: parsed.warnings.join(" ") || null,
        },
      });
    });
    await deletePrivateObject(studentImport.sourceKey).catch(() => undefined);
    console.info("Student import validated", {
      importId,
      organizationId: tenant.organizationId,
      totalRows: parsed.rows.length,
      validRows,
      invalidRows,
      skippedRows,
    });
    revalidatePath(`/students/import/${importId}`);
    return { importId };
  } catch (error) {
    const message = error instanceof Error ? error.message : publicFailure;
    await database.studentImport.update({
      where: { id: studentImport.id },
      data: {
        status: "FAILED",
        sourceKey: null,
        failureMessage: message.slice(0, 500),
        completedAt: new Date(),
      },
    });
    await deletePrivateObject(studentImport.sourceKey).catch(() => undefined);
    console.error("Student import validation failed", {
      importId,
      organizationId: tenant.organizationId,
    });
    revalidatePath(`/students/import/${importId}`);
    return { error: message };
  }
};

export const startStudentImport = async (importId: string) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentImport = await database.studentImport.findFirst({
    where: {
      id: importId,
      organizationId: tenant.organizationId,
      status: "READY",
    },
    select: { id: true, validRows: true },
  });
  if (!studentImport) {
    return { error: "Import is not ready." };
  }
  if (studentImport.validRows === 0) {
    return { error: "There are no valid students to import." };
  }
  try {
    await assertWithinPlanLimit({
      increment: studentImport.validRows,
      organizationId: tenant.organizationId,
      resource: "students",
      userId: tenant.authUserId,
    });
  } catch {
    return { error: "Student limit reached for your plan." };
  }
  await database.studentImport.updateMany({
    where: {
      id: importId,
      organizationId: tenant.organizationId,
      status: "READY",
    },
    data: { status: "PROCESSING", processingStartedAt: new Date() },
  });
  console.info("Student import started", {
    importId,
    organizationId: tenant.organizationId,
    userId: tenant.userId,
  });
  revalidatePath(`/students/import/${importId}`);
  return { importId };
};

export const executeStudentImportBatch = async (importId: string) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentImport = await database.studentImport.findFirst({
    where: {
      id: importId,
      organizationId: tenant.organizationId,
      status: "PROCESSING",
    },
    select: { id: true },
  });
  if (!studentImport) {
    return { error: "Import is not processing." };
  }
  const rows = await database.studentImportRow.findMany({
    where: { importId, organizationId: tenant.organizationId, status: "VALID" },
    orderBy: { rowNumber: "asc" },
    take: IMPORT_BATCH_SIZE,
  });
  for (const row of rows) {
    try {
      await database.$transaction(async (tx) => {
        const claimed = await tx.studentImportRow.updateMany({
          where: {
            id: row.id,
            organizationId: tenant.organizationId,
            status: "VALID",
          },
          data: { status: "PROCESSING" },
        });
        if (!claimed.count) {
          return;
        }
        const data = row.normalizedData as unknown as NormalizedStudentRow;
        const level = await tx.level.findFirst({
          where: {
            id: data.levelId,
            organizationId: tenant.organizationId,
            archivedAt: null,
          },
          select: { id: true },
        });
        if (!level) {
          throw new Error("Academic level is no longer available.");
        }
        const code = await reserveStudentCode(tx, tenant.organizationId);
        const student = await tx.student.create({
          data: {
            organizationId: tenant.organizationId,
            code,
            fullName: data.fullName,
            preferredName: data.preferredName,
            dateOfBirth: data.dateOfBirth
              ? new Date(data.dateOfBirth)
              : undefined,
            gender: data.gender,
            phone: data.phone,
            email: data.studentEmail,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            postcode: data.postcode,
            schoolName: data.schoolName,
            levelId: level.id,
            enrolledAt: data.enrolledAt
              ? new Date(data.enrolledAt)
              : new Date(),
            notes: data.notes,
          },
          select: { id: true },
        });
        const guardian = await tx.guardian.create({
          data: {
            organizationId: tenant.organizationId,
            fullName: data.guardianName,
            phone: data.guardianPhone,
            email: data.guardianEmail,
          },
          select: { id: true },
        });
        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            relationship: data.relationship,
            isPrimary: true,
            receivesBilling: true,
          },
        });
        await tx.studentImportRow.update({
          where: { id: row.id },
          data: { status: "CREATED", createdStudentId: student.id },
        });
        await tx.studentImport.update({
          where: { id: importId },
          data: {
            processedRows: { increment: 1 },
            createdRows: { increment: 1 },
          },
        });
      });
    } catch (error) {
      const message =
        error instanceof Error &&
        error.message === "Academic level is no longer available."
          ? error.message
          : "The row could not be imported.";
      await database.$transaction([
        database.studentImportRow.update({
          where: { id: row.id },
          data: { status: "FAILED", errors: [message] },
        }),
        database.studentImport.update({
          where: { id: importId },
          data: {
            processedRows: { increment: 1 },
            skippedRows: { increment: 1 },
          },
        }),
      ]);
    }
  }
  const remaining = await database.studentImportRow.count({
    where: {
      importId,
      organizationId: tenant.organizationId,
      status: { in: ["VALID", "PROCESSING"] },
    },
  });
  if (remaining === 0) {
    const failedRows = await database.studentImportRow.count({
      where: {
        importId,
        organizationId: tenant.organizationId,
        status: { in: ["INVALID", "DUPLICATE", "FAILED"] },
      },
    });
    await database.studentImport.update({
      where: { id: importId },
      data: {
        status: failedRows ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
        completedAt: new Date(),
      },
    });
    console.info("Student import completed", {
      importId,
      organizationId: tenant.organizationId,
    });
  }
  revalidatePath("/students");
  revalidatePath("/students/import");
  revalidatePath(`/students/import/${importId}`);
  return { complete: remaining === 0 };
};
