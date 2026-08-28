"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Clock, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createAssignment,
  forceCreateAssignment,
  type AssignmentActionResult,
} from "@/app/actions/assignments";
import { formatTime, timesOverlap } from "@/lib/utils";
import type { ClientShoot, ClientStaff } from "@/lib/types";
import { AssignmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Clashes = Extract<AssignmentActionResult, { clashes: unknown }>["clashes"];

function clashLine(c: { title: string; callTime: string; wrapTime: string }) {
  return `${c.title} · ${formatTime(c.callTime)} — ${formatTime(c.wrapTime)}`;
}

export function AssignCrewDialog({
  shootId,
  shootCallTime,
  shootWrapTime,
  staff,
  roles,
  existingUserIds,
  sameDayShoots = [],
}: {
  shootId: string;
  shootCallTime: string;
  shootWrapTime: string;
  staff: ClientStaff[];
  roles: string[];
  existingUserIds: Set<string>;
  sameDayShoots?: ClientShoot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<AssignmentStatus>(AssignmentStatus.TENTATIVE);
  const [conflicts, setConflicts] = useState<Clashes | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live preview: bookings for the selected person that clash with this shoot.
  const selectedClashes = useMemo(() => {
    const overlapping: Clashes["overlapping"] = [];
    const sameDayOnly: Clashes["sameDayOnly"] = [];
    if (!userId) return { overlapping, sameDayOnly };
    for (const s of sameDayShoots) {
      if (s.status === "CANCELLED") continue;
      if (!s.assignments.some((a) => a.user.id === userId)) continue;
      const clash = {
        id: s.id,
        title: s.title,
        callTime: s.callTime,
        wrapTime: s.wrapTime,
        location: s.location,
      };
      if (timesOverlap(shootCallTime, shootWrapTime, s.callTime, s.wrapTime)) {
        overlapping.push(clash);
      } else {
        sameDayOnly.push(clash);
      }
    }
    return { overlapping, sameDayOnly };
  }, [userId, sameDayShoots, shootCallTime, shootWrapTime]);

  const available = staff.filter((s) => !existingUserIds.has(s.id));

  const submit = (force: boolean) => {
    setError(null);
    const action = force ? forceCreateAssignment : createAssignment;
    startTransition(async () => {
      const res = await action({
        shootId,
        userId,
        role,
        status,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("clashes" in res && res.clashes) {
        setConflicts(res.clashes);
        return;
      }
      setOpen(false);
      setConflicts(null);
      setUserId("");
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setConflicts(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" /> Add crew
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign crew member</DialogTitle>
          <DialogDescription>
            Choose a crew member, their role, and assignment status.
          </DialogDescription>
        </DialogHeader>

        {conflicts ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="space-y-1.5">
                {conflicts.overlapping.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Already booked at this time:</p>
                    {conflicts.overlapping.map((c) => (
                      <p key={c.id} className="text-sm text-muted-foreground">{clashLine(c)}</p>
                    ))}
                  </div>
                )}
                {conflicts.sameDayOnly.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Also booked earlier/later this day:</p>
                    {conflicts.sameDayOnly.map((c) => (
                      <p key={c.id} className="text-sm text-muted-foreground">{clashLine(c)}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setConflicts(null)}>
                Choose someone else
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => submit(true)}
              >
                Assign anyway
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="crew">Crew member</Label>
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger id="crew">
                  <SelectValue placeholder="Select a crew member" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 && (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      Everyone is assigned already.
                    </p>
                  )}
                  {available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClashes.overlapping.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">Already booked at this time:</p>
                    {selectedClashes.overlapping.map((c) => (
                      <p key={c.id} className="text-muted-foreground">{clashLine(c)}</p>
                    ))}
                  </div>
                </div>
              )}
              {selectedClashes.sameDayOnly.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-2.5">
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-medium">Also booked this day (no overlap):</p>
                    {selectedClashes.sameDayOnly.map((c) => (
                      <p key={c.id} className="text-muted-foreground">{clashLine(c)}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="astatus">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AssignmentStatus)}>
                  <SelectTrigger id="astatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="TENTATIVE">Tentative</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !userId || !role}>
                {pending ? "Adding…" : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}