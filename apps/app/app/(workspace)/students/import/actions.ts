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
  type ColumnName,
  type ImportRowStatus,
  columns as importColumns,
  markWithinFileDuplicates,
  type NormalizedStudentRow,
  type RawImportData,
  rowIssues,
  type ValidationIssue,
  validateRow,
} from "./lib/validation";
import {
  IMPORT_BATCH_SIZE,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  parseStudentWorkbook,
} from "./lib/workbook";

const REVIEW_PAGE_SIZE = 50;

const publicFailure =
  "The import could not be processed. Check the workbook and try again.";

interface RecomputedRow {
  fingerprint: string;
  id: string;
  issues: ValidationIssue[];
  normalizedData?: NormalizedStudentRow;
  status: ImportRowStatus;
}

const tallyStatuses = (statuses: readonly string[]) => {
  let valid = 0;
  let invalid = 0;
  let duplicate = 0;
  for (const status of statuses) {
    if (status === "VALID") {
      valid += 1;
    } else if (status === "INVALID") {
      invalid += 1;
    } else if (status === "DUPLICATE") {
      duplicate += 1;
    }
  }
  return { total: statuses.length, valid, invalid, duplicate };
};

export const updateStudentImportRow = async ({
  importId,
  rowId,
  field,
  value,
}: {
  importId: string;
  rowId: string;
  field: string;
  value: string;
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  if (!importColumns.includes(field as ColumnName)) {
    return { error: "Unknown column." };
  }
  const session = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    select: { id: true, status: true },
  });
  if (!session || session.status !== "READY") {
    return { error: "Only imports awaiting review can be edited." };
  }
  const target = await database.studentImportRow.findFirst({
    where: {
      id: rowId,
      importId,
      organizationId: tenant.organizationId,
    },
    select: { id: true },
  });
  if (!target) {
    return { error: "Row not found." };
  }
  const [levels, storedRows] = await Promise.all([
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true, code: true, name: true },
    }),
    database.studentImportRow.findMany({
      where: { importId, organizationId: tenant.organizationId },
      select: {
        id: true,
        rawData: true,
        status: true,
        errors: true,
        fingerprint: true,
        normalizedData: true,
      },
    }),
  ]);
  // Re-validate the whole file so identity changes resolve or create
  // within-file duplicates everywhere, then persist only what changed.
  const mergedRawById = new Map<string, RawImportData>(
    storedRows.map((row) => [
      row.id,
      row.id === rowId
        ? ({
            ...(row.rawData as RawImportData),
            [field]: value.trim(),
          } satisfies RawImportData)
        : (row.rawData as RawImportData),
    ])
  );
  const recomputed = recomputeImportRows(
    [...mergedRawById].map(([id, rawData]) => ({ id, rawData })),
    levels
  );
  const nextById = new Map(recomputed.map((row) => [row.id, row]));
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const previous of storedRows) {
    const next = nextById.get(previous.id);
    if (!next) {
      continue;
    }
    const changed =
      previous.status !== next.status ||
      previous.fingerprint !== next.fingerprint ||
      JSON.stringify(previous.errors) !== JSON.stringify(next.issues) ||
      JSON.stringify(previous.normalizedData ?? null) !==
        JSON.stringify(next.normalizedData ?? null);
    if (!changed) {
      continue;
    }
    updates.push(
      database.studentImportRow.update({
        where: { id: previous.id },
        data: {
          status: next.status,
          errors: next.issues as Prisma.InputJsonValue,
          fingerprint: next.fingerprint,
          normalizedData: (next.normalizedData ??
            null) as Prisma.InputJsonValue,
        },
      })
    );
  }
  const counts = tallyStatuses(recomputed.map((row) => row.status));
  updates.push(
    database.studentImport.update({
      where: { id: importId },
      data: {
        totalRows: counts.total,
        validRows: counts.valid,
        invalidRows: counts.invalid,
        skippedRows: counts.duplicate,
      },
    })
  );
  await database.$transaction(updates);
  console.info("Student import row edited", {
    importId,
    organizationId: tenant.organizationId,
    field,
  });
  revalidatePath(`/students/import/${importId}`);
  return { ok: true as const };
};

const recomputeImportRows = (
  rows: Array<{ id: string; rawData: RawImportData }>,
  levels: Array<{ id: string; code: string; name: string }>
): RecomputedRow[] => {
  const recomputed = rows.map((row) => {
    const result = validateRow(row.rawData, { levels });
    return {
      id: row.id,
      status: result.status,
      issues: result.issues,
      fingerprint: result.fingerprint,
      normalizedData: result.normalized,
    };
  });
  markWithinFileDuplicates(recomputed);
  return recomputed;
};

const REVIEW_TAB_STATUSES = {
  all: undefined,
  invalid: ["INVALID", "DUPLICATE", "FAILED"],
  valid: ["VALID"],
} as const;

type ReviewTab = keyof typeof REVIEW_TAB_STATUSES;

export const getStudentImportRows = async ({
  importId,
  tab = "all",
  search = "",
  errorCode = "",
  page = 0,
}: {
  importId: string;
  tab?: ReviewTab;
  search?: string;
  errorCode?: string;
  page?: number;
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const session = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    select: {
      id: true,
      totalRows: true,
      validRows: true,
      invalidRows: true,
      skippedRows: true,
      failureMessage: true,
    },
  });
  if (!session) {
    return { error: "Import not found." };
  }
  const tenantScope = { importId, organizationId: tenant.organizationId };
  const statusFilter = REVIEW_TAB_STATUSES[tab];
  // Tab counts and filterable codes come from the full row set; row payloads
  // are small (capped by MAX_IMPORT_ROWS) so in-memory filtering is fine.
  const [allStatuses, tabRows] = await Promise.all([
    database.studentImportRow.findMany({
      where: tenantScope,
      select: { status: true },
    }),
    database.studentImportRow.findMany({
      where: {
        ...tenantScope,
        ...(statusFilter ? { status: { in: [...statusFilter] } } : {}),
      },
      orderBy: { rowNumber: "asc" },
      select: {
        id: true,
        rowNumber: true,
        status: true,
        rawData: true,
        errors: true,
      },
    }),
  ]);
  const counts = tallyStatuses(allStatuses.map((row) => row.status));
  const term = search.trim().toLowerCase();
  let candidates = tabRows;
  if (term) {
    candidates = candidates.filter(
      (row) =>
        String(row.rowNumber).includes(term) ||
        Object.values(row.rawData as RawImportData).some((value) =>
          value.toLowerCase().includes(term)
        )
    );
  }
  const availableCodes = [
    ...new Set(
      candidates.flatMap((row) =>
        rowIssues(row.errors)
          .filter((issue) => issue.severity === "error")
          .map((issue) => issue.code)
      )
    ),
  ].sort();
  if (errorCode) {
    candidates = candidates.filter((row) =>
      rowIssues(row.errors).some((issue) => issue.code === errorCode)
    );
  }
  const safePage = Math.max(0, page);
  const pageCount = Math.max(
    1,
    Math.ceil(candidates.length / REVIEW_PAGE_SIZE)
  );
  const clampedPage = Math.min(safePage, pageCount - 1);
  const pageRows = candidates.slice(
    clampedPage * REVIEW_PAGE_SIZE,
    (clampedPage + 1) * REVIEW_PAGE_SIZE
  );
  return {
    ok: true as const,
    page: clampedPage,
    pageSize: REVIEW_PAGE_SIZE,
    total: candidates.length,
    pageCount,
    counts: {
      all: counts.total,
      valid: counts.valid,
      invalid: counts.invalid + counts.duplicate,
    },
    errorCodes: availableCodes,
    summary: {
      totalRows: session.totalRows,
      validRows: session.validRows,
      invalidRows: session.invalidRows,
      duplicateRows: session.skippedRows,
      blockingRows: session.invalidRows + session.skippedRows,
      notes: session.failureMessage ?? "",
    },
    rows: pageRows.map((row) => ({
      id: row.id,
      rowNumber: row.rowNumber,
      status: row.status as string,
      rawData: row.rawData as RawImportData,
      issues: rowIssues(row.errors),
    })),
  };
};

export const deleteStudentImportRows = async ({
  importId,
  rowIds,
}: {
  importId: string;
  rowIds: string[];
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  if (!rowIds.length) {
    return { error: "No rows selected." };
  }
  const session = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    select: { id: true, status: true },
  });
  if (!session || session.status !== "READY") {
    return { error: "Only imports awaiting review can be edited." };
  }
  const deleted = await database.studentImportRow.deleteMany({
    where: {
      id: { in: rowIds },
      importId,
      organizationId: tenant.organizationId,
    },
  });
  const remaining = await database.studentImportRow.findMany({
    where: { importId, organizationId: tenant.organizationId },
    select: { status: true },
  });
  const counts = tallyStatuses(remaining.map((row) => row.status));
  await database.studentImport.update({
    where: { id: importId },
    data: {
      totalRows: counts.total,
      validRows: counts.valid,
      invalidRows: counts.invalid,
      skippedRows: counts.duplicate,
    },
  });
  console.info("Student import rows deleted", {
    importId,
    organizationId: tenant.organizationId,
    deleted: deleted.count,
  });
  revalidatePath(`/students/import/${importId}`);
  return { ok: true as const, deleted: deleted.count };
};

export const addStudentImportRow = async ({
  importId,
}: {
  importId: string;
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const session = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    select: { id: true, status: true },
  });
  if (!session || session.status !== "READY") {
    return { error: "Only imports awaiting review can be edited." };
  }
  const [last, statuses] = await Promise.all([
    database.studentImportRow.findFirst({
      where: { importId, organizationId: tenant.organizationId },
      orderBy: { rowNumber: "desc" },
      select: { rowNumber: true },
    }),
    database.studentImportRow.findMany({
      where: { importId, organizationId: tenant.organizationId },
      select: { status: true },
    }),
  ]);
  if (statuses.length >= MAX_IMPORT_ROWS) {
    return { error: `This import already has ${MAX_IMPORT_ROWS} rows.` };
  }
  const rawData = Object.fromEntries(
    importColumns.map((column) => [column, ""])
  ) as RawImportData;
  const result = validateRow(rawData, { levels: [] });
  const rowNumber = (last?.rowNumber ?? 1) + 1;
  const row = await database.studentImportRow.create({
    data: {
      organizationId: tenant.organizationId,
      importId,
      rowNumber,
      status: result.status,
      rawData: rawData as Prisma.InputJsonValue,
      errors: result.issues as Prisma.InputJsonValue,
      fingerprint: result.fingerprint,
    },
    select: { id: true },
  });
  const counts = tallyStatuses([
    ...statuses.map((entry) => entry.status),
    result.status,
  ]);
  await database.studentImport.update({
    where: { id: importId },
    data: {
      totalRows: counts.total,
      validRows: counts.valid,
      invalidRows: counts.invalid,
      skippedRows: counts.duplicate,
    },
  });
  console.info("Student import row added", {
    importId,
    organizationId: tenant.organizationId,
    rowNumber,
  });
  revalidatePath(`/students/import/${importId}`);
  return { ok: true as const, rowId: row.id, rowNumber };
};

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
    const counts = tallyStatuses(parsed.rows.map((row) => row.status));
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
          errors: row.issues as Prisma.InputJsonValue,
          fingerprint: row.fingerprint,
        })),
      });
      await tx.studentImport.update({
        where: { id: studentImport.id },
        data: {
          status: "READY",
          totalRows: counts.total,
          validRows: counts.valid,
          invalidRows: counts.invalid,
          skippedRows: counts.duplicate,
          validatedAt: new Date(),
          sourceKey: null,
          failureMessage: parsed.warnings.join(" ") || null,
        },
      });
    });
    await deletePrivateObject(studentImport.sourceKey).catch(() => undefined);
    console.info("Student import validation completed", {
      importId,
      organizationId: tenant.organizationId,
      ...counts,
      errorCodes: parsed.rows
        .flatMap((row) => row.issues)
        .filter((entry) => entry.severity === "error")
        .reduce<Record<string, number>>((tally, entry) => {
          tally[entry.code] = (tally[entry.code] ?? 0) + 1;
          return tally;
        }, {}),
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
    select: {
      id: true,
      validRows: true,
      invalidRows: true,
      skippedRows: true,
    },
  });
  if (!studentImport) {
    return { error: "Import is not ready." };
  }
  const blocking = studentImport.invalidRows + studentImport.skippedRows;
  if (blocking > 0) {
    return {
      error: `Fix ${blocking.toLocaleString()} row(s) with errors before importing.`,
    };
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
        const data = row.normalizedData as unknown as {
          fullName: string;
          preferredName?: string;
          dateOfBirth?: string;
          gender: "MALE" | "FEMALE" | "OTHER";
          phone?: string;
          studentEmail?: string;
          addressLine1?: string;
          addressLine2?: string;
          city?: string;
          state?: string;
          postcode?: string;
          schoolName?: string;
          levelId: string;
          enrolledAt?: string;
          notes?: string;
          guardianName: string;
          relationship: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
          guardianPhone: string;
          guardianEmail?: string;
        };
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
