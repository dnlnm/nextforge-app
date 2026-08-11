import "server-only";

import { keys } from "@repo/auth/keys";
import { database } from "@repo/database";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { protectedProcedure } from "../middleware";
import { createTRPCRouter, TRPCError } from "../trpc";

const whitespace = /\s+/;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase client authenticated as the caller (uses their access token). */
const getAuthedClient = (accessToken: string) => {
  const environment = keys();

  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL ?? "",
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
};

const updateProfileNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

const updateEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(emailPattern, "Please enter a valid email address"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const accountRouter = createTRPCRouter({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await database.user.findFirst({
      where: { authUserId: ctx.authUserId },
      select: {
        email: true,
        firstName: true,
        imageUrl: true,
        lastName: true,
      },
    });

    return {
      email: user?.email ?? ctx.authEmail,
      firstName: user?.firstName ?? null,
      imageUrl: user?.imageUrl ?? null,
      lastName: user?.lastName ?? null,
    };
  }),

  updateProfileName: protectedProcedure
    .input(updateProfileNameSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = getAuthedClient(ctx.accessToken);
      const { error } = await supabase.auth.updateUser({
        data: { name: input.name },
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const [firstName, ...lastNameParts] = input.name.split(whitespace);

      await database.user.upsert({
        where: { authUserId: ctx.authUserId },
        create: {
          authUserId: ctx.authUserId,
          email: ctx.authEmail,
          firstName: firstName || undefined,
          lastName: lastNameParts.join(" ") || undefined,
        },
        update: {
          firstName: firstName || undefined,
          lastName: lastNameParts.join(" ") || undefined,
          archivedAt: null,
        },
      });

      return { ok: true };
    }),

  updateEmail: protectedProcedure
    .input(updateEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = getAuthedClient(ctx.accessToken);
      const { error } = await supabase.auth.updateUser({ email: input.email });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      await database.user.updateMany({
        where: { authUserId: ctx.authUserId },
        data: { email: input.email },
      });

      return { ok: true };
    }),

  updatePassword: protectedProcedure
    .input(updatePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = getAuthedClient(ctx.accessToken);
      const user = await supabase.auth.getUser();

      if (user.error || !user.data.user?.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unable to verify the current session.",
        });
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.data.user.email,
        password: input.currentPassword,
      });

      if (signInError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      const { error } = await supabase.auth.updateUser({
        password: input.newPassword,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { ok: true };
    }),
});
