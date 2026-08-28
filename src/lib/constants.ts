import type { AssignmentStatus, ShootStatus } from "@prisma/client";

export const CREW_ROLES = [
  "Producer",
  "Director",
  "DP",
  "Camera Op",
  "1st AC",
  "2nd AC",
  "Gaffer",
  "Grip",
  "Sound Mixer",
  "Editor",
  "Production Coordinator",
  "HMU",
  "Stylist",
  "PA",
] as const;

export const SHOOT_STATUSES: {
  value: ShootStatus;
  label: string;
  classes: string;
}[] = [
  { value: "CONFIRMED", label: "Confirmed", classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent" },
  { value: "TENTATIVE", label: "Tentative", classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent" },
  { value: "CANCELLED", label: "Cancelled", classes: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-transparent" },
];

export const ASSIGNMENT_STATUSES: {
  value: AssignmentStatus;
  label: string;
  classes: string;
}[] = [
  { value: "CONFIRMED", label: "Confirmed", classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent" },
  { value: "TENTATIVE", label: "Tentative", classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent" },
  { value: "DECLINED", label: "Declined", classes: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-transparent" },
];

export function shootStatusInfo(status: ShootStatus) {
  return SHOOT_STATUSES.find((s) => s.value === status) ?? SHOOT_STATUSES[0];
}

export function assignmentStatusInfo(status: AssignmentStatus) {
  return ASSIGNMENT_STATUSES.find((s) => s.value === status) ?? ASSIGNMENT_STATUSES[0];
}