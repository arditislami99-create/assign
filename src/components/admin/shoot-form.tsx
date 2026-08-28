"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import type { ShootFormState } from "@/app/actions/shoots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHOOT_STATUSES } from "@/lib/constants";
import { formatTime, timesOverlap, toDateKey } from "@/lib/utils";
import type { ClientAssignment, ClientShoot } from "@/lib/types";

export function ShootForm({
  action,
  shoot,
  submitLabel = "Create shoot",
  assignments,
  sameDayShoots,
}: {
  action: (prev: ShootFormState, formData: FormData) => Promise<ShootFormState>;
  shoot?: ClientShoot;
  submitLabel?: string;
  assignments?: ClientAssignment[];
  sameDayShoots?: ClientShoot[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ShootFormState, FormData>(action, undefined);

  const [date, setDate] = useState(shoot ? toDateKey(new Date(shoot.date)) : "");
  const [callTime, setCallTime] = useState(shoot?.callTime ?? "");
  const [wrapTime, setWrapTime] = useState(shoot?.wrapTime ?? "");

  // Warn when edited times/dates would double-book already-assigned crew.
  // Only meaningful while viewing the same day the conflict data was fetched for.
  const prospectiveConflicts = useMemo(() => {
    if (!shoot || !assignments || !sameDayShoots || !date || !callTime || !wrapTime) return [];
    if (toDateKey(new Date(shoot.date)) !== date) return [];

    const seen = new Set<string>();
    const out: { userName: string; role: string; shoot: ClientShoot }[] = [];
    for (const a of assignments) {
      for (const s of sameDayShoots) {
        if (s.status === "CANCELLED") continue;
        if (!timesOverlap(callTime, wrapTime, s.callTime, s.wrapTime)) continue;
        for (const b of s.assignments) {
          if (b.user.id !== a.user.id) continue;
          const key = `${a.user.id}:${s.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ userName: a.user.name, role: a.role, shoot: s });
        }
      }
    }
    return out;
  }, [shoot, assignments, sameDayShoots, date, callTime, wrapTime]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Shoot title</Label>
          <Input id="title" name="title" placeholder="e.g. TerraForm Summer Campaign" defaultValue={shoot?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Input id="client" name="client" placeholder="Client name" defaultValue={shoot?.client} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={shoot?.status ?? "CONFIRMED"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOOT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="callTime">Call time</Label>
            <Input id="callTime" name="callTime" type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wrapTime">Wrap time</Label>
            <Input id="wrapTime" name="wrapTime" type="time" value={wrapTime} onChange={(e) => setWrapTime(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Stage B, Hollywood" defaultValue={shoot?.location} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes / call sheet link</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Parking info, gear requirements, call sheet link…"
            rows={4}
            defaultValue={shoot?.notes ?? ""}
          />
        </div>
      </div>

      {prospectiveConflicts.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium">Saving these times will double-book:</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {prospectiveConflicts.map((c, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{c.userName}</span> ({c.role}) overlaps{" "}
                  <span className="font-medium text-foreground">{c.shoot.title}</span> ·{" "}
                  {formatTime(c.shoot.callTime)} — {formatTime(c.shoot.wrapTime)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}