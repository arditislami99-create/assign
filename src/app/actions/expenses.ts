"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export type ExpenseFormState = { error?: string } | undefined;

const CATEGORIES = [
  "CREW",
  "EQUIPMENT",
  "TRAVEL",
  "LOCATION",
  "CATERING",
  "POST",
  "OTHER",
] as const;

const expenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  amount: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ error: "Amount must be a number." }).min(0, "Amount can't be negative.")
  ),
  category: z.enum(CATEGORIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  notes: z.string().trim().optional(),
  shootId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().min(1).optional()
  ),
});

function revalidateFinance(shootId?: string) {
  revalidatePath("/dashboard/finance");
  if (shootId) revalidatePath(`/dashboard/shoots/${shootId}`);
}

export async function createExpense(
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  await requireAdmin();

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { date, notes, shootId, ...rest } = parsed.data;
  await db.expense.create({
    data: {
      ...rest,
      notes: notes || null,
      shootId: shootId ?? null,
      date: new Date(`${date}T00:00:00`),
    },
  });

  revalidateFinance(shootId);
  return undefined;
}

export async function updateExpense(
  id: string,
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  await requireAdmin();

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { date, notes, shootId, ...rest } = parsed.data;
  const expense = await db.expense.update({
    where: { id },
    data: {
      ...rest,
      notes: notes || null,
      shootId: shootId ?? null,
      date: new Date(`${date}T00:00:00`),
    },
  });

  revalidateFinance(expense.shootId ?? undefined);
  if (shootId && shootId !== expense.shootId) revalidatePath(`/dashboard/shoots/${shootId}`);
  return undefined;
}

export async function deleteExpense(id: string, shootId?: string) {
  await requireAdmin();
  const expense = await db.expense.delete({ where: { id } });
  revalidateFinance(shootId ?? expense.shootId ?? undefined);
}
