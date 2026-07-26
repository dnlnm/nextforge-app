"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type GuardianRelationship } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const relationships = new Set<GuardianRelationship>([
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "OTHER",
]);

const csvLineRegex = /\r?\n/;

export const createStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const fullName = getString(formData, "fullName");
  const guardianName = getString(formData, "guardianName");

  if (!(fullName && guardianName)) {
    throw new Error("Student and guardian names are required.");
  }

  const relationship = getString(formData, "relationship") as
    | GuardianRelationship
    | undefined;

  await database.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        organizationId: tenant.organizationId,
        academicLevel: getString(formData, "academicLevel"),
        fullName,
        preferredName: getString(formData, "preferredName"),
        schoolName: getString(formData, "schoolName"),
      },
      select: { id: true },
    });
    const guardian = await tx.guardian.create({
      data: {
        organizationId: tenant.organizationId,
        email: getString(formData, "guardianEmail"),
        fullName: guardianName,
        phone: getString(formData, "guardianPhone"),
      },
      select: { id: true },
    });

    await tx.studentGuardian.create({
      data: {
        guardianId: guardian.id,
        isPrimary: true,
        receivesBilling: true,
        relationship:
          relationship && relationships.has(relationship)
            ? relationship
            : "GUARDIAN",
        studentId: student.id,
      },
    });
  });

  revalidatePath("/students");
};

export const archiveStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");

  if (!studentId) {
    throw new Error("Student is required.");
  }

  const archivedAt = new Date();

  await database.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: { id: studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
    await tx.enrollment.updateMany({
      where: { studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
  });

  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const updateStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");
  const fullName = getString(formData, "fullName");
  const guardianId = getString(formData, "guardianId");
  const guardianName = getString(formData, "guardianName");

  if (!(studentId && fullName && guardianId && guardianName)) {
    throw new Error("Student and guardian details are required.");
  }

  await database.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: { id: studentId, organizationId: tenant.organizationId },
      data: {
        academicLevel: getString(formData, "academicLevel"),
        fullName,
        preferredName: getString(formData, "preferredName"),
        schoolName: getString(formData, "schoolName"),
      },
    });
    await tx.guardian.updateMany({
      where: { id: guardianId, organizationId: tenant.organizationId },
      data: {
        email: getString(formData, "guardianEmail"),
        fullName: guardianName,
        phone: getString(formData, "guardianPhone"),
      },
    });
  });

  revalidatePath("/students");
  redirect("/students");
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current.trim());

  return cells;
};

export const importStudents = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const file = formData.get("csv");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const [headerLine, ...dataLines] = text
    .split(csvLineRegex)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    throw new Error("CSV file is empty.");
  }

  const headers = parseCsvLine(headerLine).map((header) =>
    header.toLowerCase()
  );
  const rows = dataLines.map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]])
    );
  });

  await database.$transaction(async (tx) => {
    for (const row of rows) {
      const fullName = row.fullname;
      const guardianName = row.guardianname;

      if (!(fullName && guardianName)) {
        continue;
      }

      const student = await tx.student.create({
        data: {
          organizationId: tenant.organizationId,
          academicLevel: row.academiclevel,
          fullName,
          preferredName: row.preferredname,
          schoolName: row.schoolname,
        },
        select: { id: true },
      });
      const guardian = await tx.guardian.create({
        data: {
          organizationId: tenant.organizationId,
          email: row.guardianemail,
          fullName: guardianName,
          phone: row.guardianphone,
        },
        select: { id: true },
      });

      await tx.studentGuardian.create({
        data: {
          guardianId: guardian.id,
          isPrimary: true,
          receivesBilling: true,
          studentId: student.id,
        },
      });
    }
  });

  revalidatePath("/students");
};
