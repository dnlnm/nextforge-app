"use server";

import { createClient, currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";

const whitespace = /\s+/;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateProfileName = async (name: string) => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { name: trimmed },
  });

  if (error) {
    throw error;
  }

  const [firstName, ...lastNameParts] = trimmed.split(whitespace);

  await database.user.upsert({
    where: { authUserId: user.id },
    create: {
      authUserId: user.id,
      email: user.email,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(" ") || undefined,
    },
    update: {
      firstName: firstName || undefined,
      lastName: lastNameParts.join(" ") || undefined,
      archivedAt: null,
    },
  });

  revalidatePath("/account");
};

export const updateEmail = async (email: string) => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const normalized = email.trim().toLowerCase();

  if (!emailPattern.test(normalized)) {
    throw new Error("Please enter a valid email address");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: normalized });

  if (error) {
    throw error;
  }
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword,
  });

  if (signInError) {
    throw new Error("Current password is incorrect");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw error;
  }

  revalidatePath("/account");
};
