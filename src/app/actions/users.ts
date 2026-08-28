"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Role } from "@prisma/client";

export type UserFormState = { error?: string; ok?: boolean } | undefined;

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  role: z.enum(["ADMIN", "STAFF"]),
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const updateSchema = baseSchema.extend({
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 8, {
      message: "Password must be at least 8 characters.",
    }),
});

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/staff");
  revalidatePath("/schedule");
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role === "ADMIN" ? Role.ADMIN : Role.STAFF,
      passwordHash,
    },
  });

  revalidateAll();
  return { ok: true };
}

export async function updateUser(
  id: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requireAdmin();

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const email = parsed.data.email.toLowerCase();
  const clash = await db.user.findFirst({
    where: { email, id: { not: id } },
  });
  if (clash) return { error: "Another account already uses this email." };

  // Prevent demoting or editing your own account's role accidentally locking out admin access
  const data: Record<string, unknown> = {
    name: parsed.data.name,
    email,
    phone: parsed.data.phone ?? null,
    role: parsed.data.role === "ADMIN" ? Role.ADMIN : Role.STAFF,
  };
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }
  if (id === admin.id && parsed.data.role !== "ADMIN") {
    return { error: "You cannot change your own role." };
  }

  await db.user.update({ where: { id }, data });

  revalidateAll();
  return { ok: true };
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  if (id === admin.id) return { error: "You cannot delete your own account." };

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };

  await db.user.delete({ where: { id } });

  revalidateAll();
  return {};
}
