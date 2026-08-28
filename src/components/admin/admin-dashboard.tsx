"use client";

import { AlertTriangle, Calendar, LayoutList, ListFilter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

import type { ClientShoot, ClientStaff } from "@/lib/types";
import { SHOOT_STATUSES } from "@/lib/constants";
import { formatTime, cn, timesOverlap, toDateKey } from "@/lib/utils";
import { addMonths, dayKey, monthLabel, addDays } from "@/lib/calendar";
import { MonthCalendar } from "@/components/admin/month-calendar";
import { WeekView } from "@/components/admin/week-view";
import { shootStatusInfo } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

type Filters = {
  person: string;
  role: string;
  status: string;
  search: string;
};

const DEFAULT_FILTERS: Filters = { person: "all", role: "all", status: "all", search: "" };

function useFilteredShoots(shoots: ClientShoot[], filters: Filters) {
  return useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return shoots
      .filter((s) => {
        if (filters.status !== "all" && s.status !== filters.status) return false;
        if (filters.role !== "all" && !s.assignments.some((a) => a.role === filters.role)) return false;
        if (filters.person !== "all" && !s.assignments.some((a) => a.user.id === filters.person)) return false;
        if (q) {
          const haystack = `${s.title} ${s.client} ${s.location}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shoots, filters]);
}

export function AdminDashboard({
  shoots,
  staff,
  roles,
}: {
  shoots: ClientShoot[];
  staff: ClientStaff[];
  roles: string[];
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [showPast, setShowPast] = useState(false);

  const filtered = useFilteredShoots(shoots, filters);

  const shootsByDay = useMemo(() => {
    const map = new Map<string, ClientShoot[]>();
    for (const shoot of filtered) {
      const key = toDateKey(new Date(shoot.date));
      const arr = map.get(key) ?? [];
      arr.push(shoot);
      map.set(key, arr);
    }
    return map;
  }, [filtered]);

  const bookedDays = useMemo(() => {
    const set = new Set<string>();
    if (filters.person === "all") return set;
    for (const shoot of shoots) {
      if (shoot.status === "CANCELLED") continue;
      if (shoot.assignments.some((a) => a.user.id === filters.person)) {
        set.add(toDateKey(new Date(shoot.date)));
      }
    }
    return set;
  }, [shoots, filters.person]);

  const today = new Date();
  const todayKey = dayKey(today);

  // Double-booking detection across all loaded shoots:
  // same day + overlapping times + shared crew.
  const conflicts = useMemo(() => {
    const byDay = new Map<string, ClientShoot[]>();
    for (const shoot of shoots) {
      if (shoot.status === "CANCELLED") continue;
      const key = toDateKey(new Date(shoot.date));
      const arr = byDay.get(key) ?? [];
      arr.push(shoot);
      byDay.set(key, arr);
    }

    const ids = new Set<string>();
    let count = 0;
    for (const arr of byDay.values()) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];
          if (!timesOverlap(a.callTime, a.wrapTime, b.callTime, b.wrapTime)) continue;
          const usersA = new Set(a.assignments.map((x) => x.user.id));
          const shared = b.assignments.filter((x) => usersA.has(x.user.id));
          if (shared.length === 0) continue;
          ids.add(a.id);
          ids.add(b.id);
          count += shared.length;
        }
      }
    }
    return { ids, count };
  }, [shoots]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const hasFilters = filters !== DEFAULT_FILTERS;

  const weekRangeLabel = useMemo(() => {
    const start = addDays(cursor, -((cursor.getDay() + 6) % 7));
    const end = addDays(start, 6);
    return `${formatMonthDay(start)} — ${formatMonthDay(end)}`;
  }, [cursor]);

  const stats = useMemo(() => {
    const upcoming = shoots.filter((s) => toDateKey(new Date(s.date)) >= todayKey && s.status !== "CANCELLED");
    const weekEnd = dayKey(addDays(new Date(`${todayKey}T00:00:00`), 7));
    const bookedThisWeek = new Set(
      shoots
        .filter(
          (s) =>
            s.status !== "CANCELLED" &&
            toDateKey(new Date(s.date)) >= todayKey &&
            toDateKey(new Date(s.date)) <= weekEnd
        )
        .flatMap((s) => s.assignments.filter((a) => a.status !== "DECLINED").map((a) => a.user.id))
    );
    return { upcoming: upcoming.length, bookedThisWeek: bookedThisWeek.size };
  }, [shoots, todayKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {stats.upcoming} upcoming shoots · {stats.bookedThisWeek} crew booked this week
            {conflicts.count > 0 && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  {conflicts.count} double-book{conflicts.count === 1 ? "ing" : "ings"}
                </span>
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/shoots/new">
            <Calendar className="size-4" /> New shoot
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
          <TabsList>
            <TabsTrigger value="calendar">
              <LayoutList className="size-4" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <ListFilter className="size-4" /> List
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Search shoots…"
              className="h-9 w-full pl-8 sm:w-52"
            />
          </div>
          <Select value={filters.person} onValueChange={(v) => setFilter("person", v)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All crew" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All crew</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.role} onValueChange={(v) => setFilter("role", v)}>
            <SelectTrigger className="h-9 w-full sm:w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="h-9 w-full sm:w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {SHOOT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              <X className="size-4" /> Reset
            </Button>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setCursor((c) => (calView === "month" ? addMonths(c, -1) : addDays(c, -7)))} aria-label="Previous">
                ‹
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setCursor((c) => (calView === "month" ? addMonths(c, 1) : addDays(c, 7)))} aria-label="Next">
                ›
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold tabular-nums">
                {calView === "month" ? monthLabel(cursor) : weekRangeLabel}
              </h2>
              <Tabs value={calView} onValueChange={(v) => setCalView(v as "month" | "week")}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {calView === "month" ? (
            <MonthCalendar
              cursor={cursor}
              shootsByDay={shootsByDay}
              bookedDays={bookedDays}
              today={today}
              onSelectDay={(d) => {
                setCursor(d);
                setCalView("week");
              }}
            />
          ) : (
            <WeekView
              cursor={cursor}
              shootsByDay={shootsByDay}
              bookedDays={bookedDays}
              today={today}
            />
          )}

          {filters.person !== "all" && (
            <p className="text-xs text-muted-foreground">
              <span className="size-1.5 mr-1 inline-block rounded-full bg-primary/60 align-middle" />
              Days highlighted in the calendar show when{" "}
              <span className="font-medium text-foreground">
                {staff.find((s) => s.id === filters.person)?.name}
              </span>{" "}
              is already booked.
            </p>
          )}
        </div>
      ) : (
        <ShootListView
          shoots={filtered}
          staff={staff}
          personFilter={filters.person}
          showPast={showPast}
          onTogglePast={() => setShowPast((v) => !v)}
          todayKey={todayKey}
          conflictedIds={conflicts.ids}
        />
      )}
    </div>
  );
}

function formatMonthDay(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ShootListView({
  shoots,
  staff,
  personFilter,
  showPast,
  onTogglePast,
  todayKey,
  conflictedIds,
}: {
  shoots: ClientShoot[];
  staff: ClientStaff[];
  personFilter: string;
  showPast: boolean;
  onTogglePast: () => void;
  todayKey: string;
  conflictedIds: Set<string>;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ClientShoot[]>();
    for (const s of shoots) {
      const key = toDateKey(new Date(s.date));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [shoots]);

  const upcomingGroups = groups.filter(([k]) => k >= todayKey);
  const pastGroups = groups.filter(([k]) => k < todayKey);

  const renderGroup = ([key, items]: [string, ClientShoot[]]) => {
    const isPast = key < todayKey;
    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm font-semibold">{formatDayLabel(key, isPast)}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((shoot) => (
            <ShootCard
              key={shoot.id}
              shoot={shoot}
              staff={staff}
              personFilter={personFilter}
              conflicted={conflictedIds.has(shoot.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={onTogglePast} className="gap-1 text-muted-foreground">
          {showPast ? "Hide past" : "Show past"}
        </Button>
      </div>
      {upcomingGroups.map(renderGroup)}
      {pastGroups.length > 0 && showPast && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <span className="text-sm font-semibold text-muted-foreground">Past shoots</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          {pastGroups.map(renderGroup)}
        </>
      )}
      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Calendar className="mb-3 size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No shoots match your filters</p>
          <p className="text-xs text-muted-foreground">Try adjusting or clearing the filters above.</p>
        </div>
      )}
    </div>
  );
}

function formatDayLabel(key: string, isPast: boolean): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  }).format(date) + (isPast ? " · past" : "");
}

function ShootCard({
  shoot,
  staff,
  personFilter,
  conflicted = false,
}: {
  shoot: ClientShoot;
  staff: ClientStaff[];
  personFilter: string;
  conflicted?: boolean;
}) {
  const info = shootStatusInfo(shoot.status);
  const cancelled = shoot.status === "CANCELLED";
  const badgeClasses =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold";

  return (
    <Link
      href={`/dashboard/shoots/${shoot.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:shadow-sm",
        cancelled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(badgeClasses, info.classes)}>
              {info.label}
            </span>
            {cancelled && <span className="text-xs text-muted-foreground line-through">Cancelled</span>}
          </div>
          <h3 className={cn("mt-1.5 truncate font-semibold leading-6", cancelled && "line-through decoration-muted-foreground")}>
            {shoot.title}
          </h3>
          <p className="text-xs text-muted-foreground">{shoot.client}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn(badgeClasses, "invisible")} aria-hidden="true">
            {info.label}
          </span>
          <p className="mt-1.5 -translate-y-[5px] font-mono text-sm font-semibold leading-6 tabular-nums">
            {formatTime(shoot.callTime)}
          </p>
          <p className="text-xs text-muted-foreground">wrap {formatTime(shoot.wrapTime)}</p>
        </div>
      </div>
      {conflicted && !cancelled && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          Crew double-booked this day
        </p>
      )}
      <div className="space-y-1.5">
        {shoot.assignments.map((a, idx) => {
          const isLast = idx === shoot.assignments.length - 1;
          return (
            <div key={a.id} className="flex min-w-0 items-center gap-2 text-xs">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  a.status === "CONFIRMED" && "bg-emerald-500",
                  a.status === "TENTATIVE" && "bg-amber-500",
                  a.status === "DECLINED" && "bg-rose-400"
                )}
                aria-label={a.status}
              />
              <Avatar className="size-5 shrink-0">
                <AvatarFallback className="text-[9px]">{initials(a.user.name)}</AvatarFallback>
              </Avatar>
              <span className={cn("truncate font-medium", a.status === "DECLINED" && "text-muted-foreground line-through")}>
                {a.user.name}
              </span>
              <span className="truncate text-muted-foreground">· {a.role}</span>
              {isLast && (
                <span className="ml-auto shrink-0 pl-2 text-muted-foreground">{shoot.location}</span>
              )}
            </div>
          );
        })}
        {shoot.assignments.length === 0 && (
          <p className="flex items-center justify-between gap-2 text-xs italic text-muted-foreground/70">
            <span>No crew assigned yet</span>
            <span className="shrink-0 not-italic">{shoot.location}</span>
          </p>
        )}
      </div>
      {personFilter !== "all" &&
        (() => {
          const person = staff.find((s) => s.id === personFilter);
          const my = shoot.assignments.find((a) => a.user.id === personFilter);
          return my && person ? (
            <p className="text-xs">
              <span className="font-medium text-foreground">{person.name}</span> — {my.role}
            </p>
          ) : null;
        })()}
    </Link>
  );
}