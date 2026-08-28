"use client";

import { cn, formatTime } from "@/lib/utils";
import { dayKey, getWeekDays, isSameDay, WEEKDAY_LABELS } from "@/lib/calendar";
import type { ClientShoot } from "@/lib/types";
import { shootStatusInfo } from "@/lib/constants";
import Link from "next/link";

export function WeekView({
  cursor,
  shootsByDay,
  bookedDays,
  today,
}: {
  cursor: Date;
  shootsByDay: Map<string, ClientShoot[]>;
  bookedDays: Set<string>;
  today: Date;
}) {
  const days = getWeekDays(cursor);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const key = dayKey(day);
        const shoots = shootsByDay.get(key) ?? [];
        const isToday = isSameDay(day, today);
        const isBooked = bookedDays.has(key);
        const weekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            key={key}
            className={cn(
              "flex flex-col rounded-xl border bg-card",
              isToday && "ring-1 ring-ring",
              weekend && !isToday && "bg-muted/40"
            )}
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", isToday ? "text-primary" : "")}>
                  {day.getDate()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {WEEKDAY_LABELS[(day.getDay() + 6) % 7]}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isBooked && <span className="size-1.5 rounded-full bg-primary/60" />}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {shoots.length > 0 ? `${shoots.length} shoot${shoots.length > 1 ? "s" : ""}` : ""}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-2">
              {shoots.length === 0 && (
                <p className="px-1 py-3 text-center text-xs text-muted-foreground/70">—</p>
              )}
              {shoots.map((shoot) => (
                <Link
                  key={shoot.id}
                  href={`/dashboard/shoots/${shoot.id}`}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border px-2 py-1.5 transition-colors hover:brightness-95 dark:hover:brightness-125",
                    shootStatusInfo(shoot.status).classes
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-semibold tabular-nums">
                      {formatTime(shoot.callTime)}
                    </span>
                    {shoot.status === "CANCELLED" && (
                      <span className="text-[10px] font-semibold">Cancelled</span>
                    )}
                  </div>
                  <span className="truncate text-xs font-medium">{shoot.title}</span>
                  <span className="truncate text-[10px] opacity-70">{shoot.client}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}