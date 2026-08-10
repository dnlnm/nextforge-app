"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { type DayOfWeek, daysOfWeek } from "@repo/schemas/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildClassCode,
  isValidClassCode,
  normalizeClassCode,
} from "@/lib/codes";
import { assertWithinPlanLimit } from "../billing/limits";

const days = new Set<DayOfWeek>(daysOfWeek);

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getInt = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const getDate = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
};
const getMoneySen = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) ? undefined : Math.round(parsed * 100);
};

const getAcademicYear = (formData: FormData) => {
  const value = getInt(formData, "academicYear");

  if (!value || value < 2000 || value > 2100) {
    throw new Error("A valid academic year is required.");
  }

  return value;
};

// Resolve a unique class code for an organization. Prefers a user-supplied
// code; otherwise builds one from subject/level/year and appends a numeric
// suffix (e.g. PHY-SPM-26-2) until it is unique.
const resolveClassCode = async (
  organizationId: string,
  {
    academicYear,
    levelCode,
    submittedCode,
    subjectCode,
  }: {
    academicYear: number;
    levelCode: string;
    submittedCode?: string;
    subjectCode: string;
  }
) => {
  if (submittedCode) {
    const code = normalizeClassCode(submittedCode);

    if (!isValidClassCode(code)) {
      throw new Error(
        "Class code can only contain letters, numbers, and dashes."
      );
    }

    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (clash) {
      throw new Error("A class with this code already exists.");
    }

    return code;
  }

  const base = buildClassCode({ academicYear, levelCode, subjectCode });
  let suffix = 1;
  let code = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (!clash) {
      return code;
    }

    suffix += 1;
    code = buildClassCode({
      academicYear,
      levelCode,
      subjectCode,
      suffix,
    });
  }
};

interface ScheduleInput {
  readonly dayOfWeek: DayOfWeek;
  readonly endsAt: string;
  readonly roomId: string;
  readonly startsAt: string;
}

const parseSchedules = (formData: FormData): ScheduleInput[] => {
  const schedules: ScheduleInput[] = [];
  let index = 0;

  while (formData.has(`schedules[${index}].dayOfWeek`)) {
    const dayOfWeek = getString(formData, `schedules[${index}].dayOfWeek`) as
      | DayOfWeek
      | undefined;
    const startsAt = getString(formData, `schedules[${index}].startsAt`);
    const endsAt = getString(formData, `schedules[${index}].endsAt`);
    const roomId = getString(formData, `schedules[${index}].roomId`);

    if (dayOfWeek && startsAt && endsAt && roomId) {
      schedules.push({ dayOfWeek, endsAt, roomId, startsAt });
    }

    index += 1;
  }

  return schedules;
};

const timeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const hours = Number.parseInt(hour, 10);
  const minutes = Number.parseInt(minute, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const timesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  if (s1 === null || e1 === null || s2 === null || e2 === null) {
    return false;
  }

  return s1 < e2 && s2 < e1;
};

const assertSchedulesValid = async (
  organizationId: string,
  schedules: ScheduleInput[]
) => {
  if (schedules.length === 0) {
    throw new Error("At least one schedule is required.");
  }

  const seenDays = new Set<DayOfWeek>();

  for (const schedule of schedules) {
    if (!days.has(schedule.dayOfWeek)) {
      throw new Error(`Invalid class day: ${schedule.dayOfWeek}`);
    }

    if (seenDays.has(schedule.dayOfWeek)) {
      throw new Error("Each schedule must use a different day of the week.");
    }

    seenDays.add(schedule.dayOfWeek);

    const start = timeToMinutes(schedule.startsAt);
    const end = timeToMinutes(schedule.endsAt);

    if (start === null || end === null) {
      throw new Error("Schedule times must use the HH:MM format.");
    }

    if (end <= start) {
      throw new Error("Schedule end time must be after the start time.");
    }

    const room = await database.room.findFirst({
      where: {
        id: schedule.roomId,
        organizationId,
        status: "ACTIVE",
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!room) {
      throw new Error("A selected room could not be found.");
    }
  }
};

const assertNoTeacherConflicts = async (
  organizationId: string,
  teacherId: string,
  schedules: ScheduleInput[],
  excludedClassId?: string
) => {
  const conflictingClasses = await database.learningClass.findMany({
    where: {
      organizationId,
      teacherId,
      status: "ACTIVE",
      archivedAt: null,
      ...(excludedClassId ? { NOT: { id: excludedClassId } } : {}),
    },
    select: {
      name: true,
      schedules: {
        select: { dayOfWeek: true, endsAt: true, startsAt: true },
      },
    },
  });

  const conflicts: string[] = [];

  for (const schedule of schedules) {
    for (const existingClass of conflictingClasses) {
      for (const existingSchedule of existingClass.schedules) {
        if (
          existingSchedule.dayOfWeek === schedule.dayOfWeek &&
          timesOverlap(
            schedule.startsAt,
            schedule.endsAt,
            existingSchedule.startsAt,
            existingSchedule.endsAt
          )
        ) {
          conflicts.push(
            `${existingClass.name} (${existingSchedule.dayOfWeek} ${existingSchedule.startsAt}-${existingSchedule.endsAt})`
          );
        }
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Teacher has a scheduling conflict with: ${conflicts.join(", ")}`
    );
  }
};

export const createClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");
  const subjectId = getString(formData, "subjectId");
  const levelId = getString(formData, "levelId");
  const teacherId = getString(formData, "teacherId");
  const academicYear = getAcademicYear(formData);
  const startsOn = getDate(formData, "startDate");
  const endsOn = getDate(formData, "endDate");
  const schedules = parseSchedules(formData);

  if (!(name && subjectId && levelId && teacherId && startsOn)) {
    throw new Error(
      "Class name, subject, level, teacher, and start date are required."
    );
  }

  await assertSchedulesValid(tenant.organizationId, schedules);
  await assertNoTeacherConflicts(tenant.organizationId, teacherId, schedules);

  const [subject, level, teacher] = await Promise.all([
    database.subject.findFirst({
      where: { id: subjectId, organizationId: tenant.organizationId },
      select: { code: true, id: true },
    }),
    database.level.findFirst({
      where: {
        id: levelId,
        organizationId: tenant.organizationId,
        archivedAt: null,
      },
      select: { code: true, id: true },
    }),
    database.teacherProfile.findFirst({
      where: {
        id: teacherId,
        organizationId: tenant.organizationId,
        archivedAt: null,
      },
      select: { id: true },
    }),
  ]);

  if (!subject) {
    throw new Error("Subject not found.");
  }

  if (!level) {
    throw new Error("Level not found.");
  }

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "classes",
    userId: tenant.authUserId,
  });

  const code = await resolveClassCode(tenant.organizationId, {
    academicYear,
    levelCode: level.code,
    subjectCode: subject.code,
    submittedCode: getString(formData, "code"),
  });

  const created = await database.$transaction(async (tx) => {
    const learningClass = await tx.learningClass.create({
      data: {
        academicYear,
        capacity: getInt(formData, "capacity"),
        code,
        endsOn,
        levelId: level.id,
        monthlyFeeSen: getMoneySen(formData, "monthlyFee") ?? 0,
        name,
        organizationId: tenant.organizationId,
        startsOn,
        subjectId: subject.id,
        teacherId: teacher.id,
      },
      select: { id: true },
    });

    await tx.classSchedule.createMany({
      data: schedules.map((schedule) => ({
        classId: learningClass.id,
        dayOfWeek: schedule.dayOfWeek,
        endsAt: schedule.endsAt,
        roomId: schedule.roomId,
        startsAt: schedule.startsAt,
      })),
    });

    return learningClass;
  });

  revalidatePath("/classes");
  revalidatePath("/");
  redirect(`/classes/${created.id}`);
};

export const enrollStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");
  const studentId = getString(formData, "studentId");

  if (!(classId && studentId)) {
    throw new Error("Class and student are required.");
  }

  const [learningClass, student] = await Promise.all([
    database.learningClass.findFirst({
      where: { id: classId, organizationId: tenant.organizationId },
      select: { id: true },
    }),
    database.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      select: { id: true },
    }),
  ]);

  if (!(learningClass && student)) {
    throw new Error("Class or student not found.");
  }

  await database.enrollment.create({
    data: {
      organizationId: tenant.organizationId,
      classId: learningClass.id,
      customFeeSen: getMoneySen(formData, "customFee"),
      startsOn: getDate(formData, "startsOn") ?? new Date(),
      studentId: student.id,
    },
  });

  revalidatePath("/classes");
};

export const archiveClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");

  if (!classId) {
    throw new Error("Class is required.");
  }

  const archivedAt = new Date();

  await database.$transaction(async (tx) => {
    await tx.learningClass.updateMany({
      where: { id: classId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
    await tx.enrollment.updateMany({
      where: { classId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
  });

  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const updateClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");
  const name = getString(formData, "name");
  const subjectId = getString(formData, "subjectId");
  const startsOn = getDate(formData, "startDate");
  const endsOn = getDate(formData, "endDate");
  const schedules = parseSchedules(formData);

  if (!(classId && name && subjectId && startsOn)) {
    throw new Error("Class details are required.");
  }

  await assertSchedulesValid(tenant.organizationId, schedules);

  const teacherId = getString(formData, "teacherId");
  const levelId = getString(formData, "levelId");
  const submittedCode = getString(formData, "code");
  const academicYear = getAcademicYear(formData);

  if (teacherId) {
    await assertNoTeacherConflicts(
      tenant.organizationId,
      teacherId,
      schedules,
      classId
    );
  }

  if (submittedCode) {
    const code = normalizeClassCode(submittedCode);

    if (!isValidClassCode(code)) {
      throw new Error(
        "Class code can only contain letters, numbers, and dashes."
      );
    }

    const clash = await database.learningClass.findFirst({
      where: {
        organizationId: tenant.organizationId,
        code,
        NOT: { id: classId },
      },
      select: { id: true },
    });

    if (clash) {
      throw new Error("A class with this code already exists.");
    }
  }

  await database.$transaction(async (tx) => {
    await tx.learningClass.updateMany({
      where: { id: classId, organizationId: tenant.organizationId },
      data: {
        academicYear,
        capacity: getInt(formData, "capacity"),
        code: submittedCode ? normalizeClassCode(submittedCode) : undefined,
        endsOn,
        levelId: levelId === "none" ? null : levelId,
        monthlyFeeSen: getMoneySen(formData, "monthlyFee") ?? 0,
        name,
        startsOn,
        subjectId,
        teacherId: teacherId === "none" ? null : teacherId,
      },
    });

    await tx.classSchedule.deleteMany({ where: { classId } });
    await tx.classSchedule.createMany({
      data: schedules.map((schedule) => ({
        classId,
        dayOfWeek: schedule.dayOfWeek,
        endsAt: schedule.endsAt,
        roomId: schedule.roomId,
        startsAt: schedule.startsAt,
      })),
    });
  });

  revalidatePath("/classes");
  redirect("/classes");
};

export const updateEnrollment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const enrollmentId = getString(formData, "enrollmentId");

  if (!enrollmentId) {
    throw new Error("Enrollment is required.");
  }

  await database.enrollment.updateMany({
    where: { id: enrollmentId, organizationId: tenant.organizationId },
    data: {
      customFeeSen: getMoneySen(formData, "customFee"),
      startsOn: getDate(formData, "startsOn"),
    },
  });

  revalidatePath("/classes");
};

export const endEnrollment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const enrollmentId = getString(formData, "enrollmentId");

  if (!enrollmentId) {
    throw new Error("Enrollment is required.");
  }

  await database.enrollment.updateMany({
    where: { id: enrollmentId, organizationId: tenant.organizationId },
    data: { endsOn: new Date(), status: "ENDED" },
  });

  revalidatePath("/classes");
};
