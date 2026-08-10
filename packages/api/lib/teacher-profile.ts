import { database } from "@repo/database";

export const UNASSIGNED_TEACHER_PROFILE_ID = "__unassigned_teacher__";

const findTeacherProfileForUser = (organizationId: string, userId: string) =>
  database.teacherProfile.findFirst({
    where: { archivedAt: null, organizationId, userId },
    select: { fullName: true, id: true },
  });

export const getTeacherProfileId = async (ctx: {
  readonly organizationId: string;
  readonly role: string;
  readonly userId: string;
}) => {
  if (ctx.role !== "TEACHER") {
    return;
  }

  const teacher = await findTeacherProfileForUser(
    ctx.organizationId,
    ctx.userId
  );

  return teacher?.id ?? UNASSIGNED_TEACHER_PROFILE_ID;
};
