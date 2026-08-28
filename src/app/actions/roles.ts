"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export type RoleFormState = { error?: string; ok?: boolean } | undefined;

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters.")
    .max(40, "Role name is too long."),
});

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  revalidatePath("/schedule");
}

export async function createProductionRole(
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  await requireAdmin();

  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const name = parsed.data.name;
  const existing = await db.productionRole.findFirst({ where: { name } });
  if (existing) return { error: "This role already exists." };

  await db.productionRole.create({ data: { name } });

  revalidateAll();
  return { ok: true };
}

export async function updateProductionRole(
  id: string,
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  await requireAdmin();

  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const name = parsed.data.name;
  const clash = await db.productionRole.findFirst({
    where: { name, id: { not: id } },
  });
  if (clash) return { error: "A role with this name already exists." };

  await db.productionRole.update({ where: { id }, data: { name } });

  revalidateAll();
  return { ok: true };
}

export async function deleteProductionRole(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const role = await db.productionRole.findUnique({ where: { id } });
  if (!role) return { error: "Role not found." };

  const inUse = await db.assignment.count({ where: { role: role.name } });
  if (inUse > 0) {
    return {
      error: `This role is used by ${inUse} assignment${inUse === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  await db.productionRole.delete({ where: { id } });

  revalidateAll();
  return {};
}