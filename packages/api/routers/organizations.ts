import { database } from "@repo/database";
import { switchOrganizationInputSchema } from "@repo/schemas/organizations";
import { protectedProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

const membershipSelect = {
  id: true,
  role: true,
  organization: {
    select: {
      id: true,
      imageUrl: true,
      name: true,
      slug: true,
    },
  },
} as const;

export const organizationsRouter = createTRPCRouter({
  memberships: protectedProcedure.query(({ ctx }) =>
    database.organizationMembership.findMany({
      where: {
        status: "ACTIVE",
        organization: { status: "ACTIVE" },
        user: { archivedAt: null, authUserId: ctx.authUserId },
      },
      orderBy: { createdAt: "asc" },
      select: membershipSelect,
    })
  ),

  validateSwitch: protectedProcedure
    .input(switchOrganizationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await database.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          status: "ACTIVE",
          organization: { status: "ACTIVE" },
          user: { archivedAt: null, authUserId: ctx.authUserId },
        },
        select: membershipSelect,
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this organisation.",
        });
      }

      return membership;
    }),
});
