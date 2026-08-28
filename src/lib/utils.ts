import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatTime(hhmm: string): string {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map(Number)
  return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

export function formatDateLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d)
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function timesOverlap(
  call1: string,
  wrap1: string,
  call2: string,
  wrap2: string
): boolean {
  return toMinutes(call1) < toMinutes(wrap2) && toMinutes(call2) < toMinutes(wrap1)
}