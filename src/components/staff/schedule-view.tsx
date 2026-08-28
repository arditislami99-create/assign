"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  LayoutList,
  MapPin,
  X,
} from "lucide-react";

import { updateMyAssignment } from "@/app/actions/assignments";
import { assignmentStatusInfo, shootStatusInfo } from "@/lib/constants";
import { formatTime, cn } from "@/lib/utils";
import {
  addMonths,
  dayKey,
  getMonthMatrix,
  isSameDay,
  monthLabel,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MyAssignmentClient as MyAssignment } from "@/lib/data";

export function ScheduleView({
  name,
  upcoming,
  past,
}: {
  name: string;
  upcoming: MyAssignment[];
  past: MyAssignment[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const firstName = name.split(" ")[0];

  const mark = (assignmentId: string, status: "CONFIRMED" | "DECLINED") => {
    setPendingId(assignmentId);
    updateMyAssignment({ assignmentId, status }).finally(() => {
      setPendingId(null);
      router.refresh();
    });
  };

  const all = useMemo(() => {
    const merged = [...upcoming, ...past];
    return merged.sort((a, b) => {
      const ad = new Date(a.shoot.date);
      const bd = new Date(b.shoot.date);
      return ad.getTime() - bd.getTime();
    });
  }, [upcoming, past]);

  const assignmentsByDay = useMemo(() => {
    const map = new Map<string, MyAssignment[]>();
    for (const a of all) {
      const key = dayKey(new Date(a.shoot.date));
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [all]);

  const selectedKey = selectedDay ? dayKey(selectedDay) : null;
  const dayAssignments = selectedKey ? (assignmentsByDay.get(selectedKey) ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey {firstName} — here&apos;s your next gig{upcoming.length === 1 ? "" : "s"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {upcoming.length} upcoming assignment{upcoming.length === 1 ? "" : "s"} on your schedule.
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
          <TabsList>
            <TabsTrigger value="list">
              <LayoutList className="size-4" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarRange className="size-4" /> Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "calendar" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month">‹</Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">›</Button>
            </div>
            <h2 className="text-base font-semibold">{monthLabel(cursor)}</h2>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-7 border-b">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="px-1 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground">
                  {d[0]}
                </div>
              ))}
            </div>
            {getMonthMatrix(cursor).map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
                {week.map((day) => {
                  const key = dayKey(day);
                  const count = assignmentsByDay.get(key)?.length ?? 0;
                  const inMonth = day.getMonth() === cursor.getMonth();
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedDay(day);
                        setView("calendar");
                      }}
                      className={cn(
                        "flex min-h-[64px] flex-col items-center justify-start gap-1 border-r p-1 last:border-r-0 sm:min-h-[84px]",
                        wi === 5 && "border-b-0",
                        !inMonth && "bg-muted/30",
                        "hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                          isToday
                            ? "bg-primary font-semibold text-primary-foreground"
                            : isSelected
                              ? "bg-secondary font-semibold"
                              : inMonth
                                ? "font-medium"
                                : "text-muted-foreground/60"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-semibold text-primary">
                          {count} {count === 1 ? "gig" : "gigs"}
                        </span>
                      )}
                      {count === 0 && <span className="h-3" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {selectedDay && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(selectedDay)}
              </h3>
              {dayAssignments.length === 0 ? (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No assignments this day.
                </p>
              ) : (
                dayAssignments.map((a) => <AssignmentCard key={a.id} a={a} mark={mark} pending={pendingId === a.id} />)
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.length === 0 && past.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <CalendarDays className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Nothing on your schedule yet</p>
              <p className="text-xs text-muted-foreground">When a producer assigns you, it shows up here.</p>
            </div>
          )}
          {upcoming.map((a) => (
            <AssignmentCard key={a.id} a={a} mark={mark} pending={pendingId === a.id} />
          ))}
          {past.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4">
                <span className="text-sm font-semibold text-muted-foreground">Past</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              {past.map((a) => (
                <AssignmentCard key={a.id} a={a} mark={mark} pending={pendingId === a.id} past />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  a,
  mark,
  pending,
  past = false,
}: {
  a: MyAssignment;
  mark: (id: string, status: "CONFIRMED" | "DECLINED") => void;
  pending: boolean;
  past?: boolean;
}) {
  const shootInfo = shootStatusInfo(a.shoot.status);
  const myInfo = assignmentStatusInfo(a.status);
  const cancelled = a.shoot.status === "CANCELLED";
  const date = new Date(a.shoot.date);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-opacity",
        cancelled && "opacity-60",
        past && "opacity-70"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border bg-muted/50 py-2">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {date.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-2xl font-semibold leading-none tabular-nums">{date.getDate()}</span>
            <span className="mt-1 text-[10px] text-muted-foreground">
              {date.toLocaleDateString("en-US", { weekday: "short" })}
            </span>
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn("font-semibold", cancelled && "line-through decoration-muted-foreground")}>
                {a.shoot.title}
              </h3>
              <Badge variant="secondary">{a.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{a.shoot.client}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                Call {formatTime(a.shoot.callTime)} · Wrap {formatTime(a.shoot.wrapTime)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {a.shoot.location}
              </span>
              <Badge className={shootInfo.classes}>{shootInfo.label}</Badge>
            </div>
            {a.shoot.notes && <p className="text-xs text-muted-foreground">{a.shoot.notes}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          {myInfo.value === "CONFIRMED" ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" /> Confirmed
            </Badge>
          ) : myInfo.value === "DECLINED" ? (
            <Badge variant="outline" className="gap-1 text-rose-600 dark:text-rose-400">
              <X className="size-3" /> Unavailable
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => mark(a.id, "DECLINED")}
                disabled={pending}
              >
                <X className="size-3.5" /> Unavailable
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => mark(a.id, "CONFIRMED")}
                disabled={pending}
              >
                <Check className="size-3.5" /> Confirm
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}