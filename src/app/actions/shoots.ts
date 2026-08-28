"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export type ShootFormState = { error?: string } | undefined;

const shootSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  client: z.string().trim().min(1, "Client is required."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  callTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid call time."),
  wrapTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid wrap time."),
  location: z.string().trim().min(1, "Location is required."),
  notes: z.string().trim().optional(),
  status: z.enum(["CONFIRMED", "TENTATIVE", "CANCELLED"]),
});

export async function createShoot(
  _prev: ShootFormState,
  formData: FormData
): Promise<ShootFormState> {
  await requireAdmin();

  const parsed = shootSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { date, ...rest } = parsed.data;
  const dateOnly = new Date(`${date}T00:00:00`);

  const shoot = await db.shoot.create({
    data: { ...rest, date: dateOnly },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/shoots/${shoot.id}`);
}

export async function updateShoot(
  id: string,
  _prev: ShootFormState,
  formData: FormData
): Promise<ShootFormState> {
  await requireAdmin();

  const parsed = shootSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { date, ...rest } = parsed.data;
  const dateOnly = new Date(`${date}T00:00:00`);

  await db.shoot.update({
    where: { id },
    data: { ...rest, date: dateOnly },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/shoots/${id}`);
  redirect(`/dashboard/shoots/${id}`);
}

export async function deleteShoot(id: string) {
  await requireAdmin();
  await db.shoot.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
