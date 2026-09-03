"use client";

import { cn } from "@/lib/utils";
import { dayKey, isSameDay, getMonthMatrix, WEEKDAY_LABELS } from "@/lib/calendar";
import type { ClientShoot } from "@/lib/types";
import { ShootChip } from "@/components/admin/shoot-chip";

export function MonthCalendar({
  cursor,
  shootsByDay,
  bookedDays,
  today,
  onSelectDay,
}: {
  cursor: Date;
  shootsByDay: Map<string, ClientShoot[]>;
  bookedDays: Set<string>;
  today: Date;
  onSelectDay?: (day: Date) => void;
}) {
  const weeks = getMonthMatrix(cursor);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
              i >= 5 && "text-muted-foreground/70"
            )}
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day) => {
            const key = dayKey(day);
            const shoots = shootsByDay.get(key) ?? [];
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const isBooked = bookedDays.has(key);
            const maxVisible = 3;

            const clickable = !!onSelectDay;

            return (
              <div
                key={key}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? `View ${day.toLocaleDateString()}` : undefined}
                onClick={clickable ? () => onSelectDay(day) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectDay(day);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "group relative flex min-h-[72px] flex-col gap-1 border-r border-b p-1 text-left align-top last:border-r-0 sm:min-h-[96px] sm:p-1.5",
                  wi === weeks.length - 1 && "border-b-0",
                  clickable && "cursor-pointer hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring",
                  !inMonth && "bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday
                        ? "bg-primary font-semibold text-primary-foreground"
                        : inMonth
                          ? "font-medium text-foreground"
                          : "text-muted-foreground/60"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {isBooked && !isToday && (
                    <span className="size-1.5 rounded-full bg-primary/60" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {shoots.slice(0, maxVisible).map((shoot) => (
                    <div key={shoot.id} onClick={(e) => e.stopPropagation()}>
                      <ShootChip shoot={shoot} compact={shoots.length > 2} />
                    </div>
                  ))}
                  {shoots.length > maxVisible && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      +{shoots.length - maxVisible} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}