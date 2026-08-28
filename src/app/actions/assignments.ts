"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/session";
import { findBookingClashes, type BookingClashes } from "@/lib/conflicts";
import { AssignmentStatus } from "@prisma/client";

export type AssignmentActionResult =
  | { error: string }
  | { clashes: BookingClashes }
  | { ok: true };

const createAssignmentSchema = z.object({
  shootId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().trim().min(1),
  status: z.enum(["CONFIRMED", "TENTATIVE", "DECLINED"]),
});

export async function createAssignment(input: {
  shootId: string;
  userId: string;
  role: string;
  status: AssignmentStatus;
}): Promise<AssignmentActionResult> {
  await requireAdmin();

  const parsed = createAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "All fields are required." };

  const shoot = await db.shoot.findUnique({
    where: { id: parsed.data.shootId },
    select: { date: true, callTime: true, wrapTime: true },
  });
  if (!shoot) return { error: "Shoot not found." };

  const existing = await db.assignment.findUnique({
    where: {
      shootId_userId: {
        shootId: parsed.data.shootId,
        userId: parsed.data.userId,
      },
    },
  });
  if (existing) return { error: "This person is already assigned to the shoot." };

  const clashes = await findBookingClashes({
    userId: parsed.data.userId,
    date: shoot.date,
    callTime: shoot.callTime,
    wrapTime: shoot.wrapTime,
  });

  if (clashes.overlapping.length > 0 || clashes.sameDayOnly.length > 0) {
    return { clashes };
  }

  await db.assignment.create({
    data: {
      shootId: parsed.data.shootId,
      userId: parsed.data.userId,
      role: parsed.data.role,
      status: parsed.data.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/shoots/${parsed.data.shootId}`);
  return { ok: true };
}

export async function forceCreateAssignment(input: {
  shootId: string;
  userId: string;
  role: string;
  status: AssignmentStatus;
}): Promise<AssignmentActionResult> {
  await requireAdmin();

  await db.assignment.create({
    data: {
      shootId: input.shootId,
      userId: input.userId,
      role: input.role,
      status: input.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/shoots/${input.shootId}`);
  return { ok: true };
}

const updateStatusSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.enum(["CONFIRMED", "TENTATIVE", "DECLINED"]),
});

export async function updateAssignmentStatus(input: {
  assignmentId: string;
  status: AssignmentStatus;
}): Promise<AssignmentActionResult> {
  await requireAdmin();

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status." };

  const assignment = await db.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    select: { shootId: true },
  });
  if (!assignment) return { error: "Assignment not found." };

  await db.assignment.update({
    where: { id: parsed.data.assignmentId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/shoots/${assignment.shootId}`);
  return { ok: true };
}

export async function deleteAssignment(assignmentId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { shootId: true },
  });
  if (!assignment) return { error: "Assignment not found." };

  await db.assignment.delete({ where: { id: assignmentId } });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/shoots/${assignment.shootId}`);
  return {};
}

const myStatusSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.enum(["CONFIRMED", "DECLINED"]),
});

export async function updateMyAssignment(input: {
  assignmentId: string;
  status: "CONFIRMED" | "DECLINED";
}): Promise<{ error?: string }> {
  const user = await requireUser();

  const parsed = myStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status." };

  const assignment = await db.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
  });
  if (!assignment) return { error: "Assignment not found." };
  if (assignment.userId !== user.id) return { error: "Not your assignment." };

  await db.assignment.update({
    where: { id: parsed.data.assignmentId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/schedule");
  return {};
}