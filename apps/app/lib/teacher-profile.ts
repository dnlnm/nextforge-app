import { database, type MembershipRole } from "@repo/database";

export const UNASSIGNED_TEACHER_PROFILE_ID = "__unassigned_teacher__";

export const findTeacherProfileForUser = (
  organizationId: string,
  userId: string
) =>
  database.teacherProfile.findFirst({
    where: { archivedAt: null, organizationId, userId },
    select: { fullName: true, id: true },
  });

export const getTeacherProfileId = async (tenant: {
  readonly organizationId: string;
  readonly role: MembershipRole;
  readonly userId: string;
}) => {
  if (tenant.role !== "TEACHER") {
    return;
  }

  const teacher = await findTeacherProfileForUser(
    tenant.organizationId,
    tenant.userId
  );

  return teacher?.id ?? UNASSIGNED_TEACHER_PROFILE_ID;
};
