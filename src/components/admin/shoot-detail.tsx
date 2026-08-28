"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, Clock, MapPin, Pencil, Trash2, Users } from "lucide-react";

import { deleteShoot } from "@/app/actions/shoots";
import {
  deleteAssignment,
  updateAssignmentStatus,
} from "@/app/actions/assignments";
import { ShootForm } from "@/components/admin/shoot-form";
import { updateShoot } from "@/app/actions/shoots";
import { AssignCrewDialog } from "@/components/admin/assign-crew-dialog";
import { shootStatusInfo } from "@/lib/constants";
import { formatTime, timesOverlap } from "@/lib/utils";
import type { ClientShoot, ClientStaff } from "@/lib/types";
import { AssignmentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ShootDetail({
  shoot,
  staff,
  sameDayShoots,
  roles,
}: {
  shoot: ClientShoot;
  staff: ClientStaff[];
  sameDayShoots: ClientShoot[];
  roles: string[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const info = shootStatusInfo(shoot.status);
  const cancelled = shoot.status === "CANCELLED";

  const conflictsByAssignment = useMemo(() => {
    const map = new Map<string, { shoot: ClientShoot; role: string }[]>();
    for (const a of shoot.assignments) {
      const conflicts: { shoot: ClientShoot; role: string }[] = [];
      for (const s of sameDayShoots) {
        if (s.status === "CANCELLED") continue;
        for (const b of s.assignments) {
          if (b.user.id !== a.user.id) continue;
          if (timesOverlap(shoot.callTime, shoot.wrapTime, s.callTime, s.wrapTime)) {
            conflicts.push({ shoot: s, role: b.role });
          }
        }
      }
      if (conflicts.length > 0) map.set(a.id, conflicts);
    }
    return map;
  }, [shoot, sameDayShoots]);

  const existingUserIds = useMemo(
    () => new Set(shoot.assignments.map((a) => a.user.id)),
    [shoot.assignments]
  );

  const changeStatus = (assignmentId: string, status: AssignmentStatus) => {
    startTransition(async () => {
      await updateAssignmentStatus({ assignmentId, status });
      router.refresh();
    });
  };

  const remove = (assignmentId: string) => {
    startTransition(async () => {
      await deleteAssignment(assignmentId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={info.classes}>{info.label}</Badge>
            <span className="text-sm text-muted-foreground">{shoot.client}</span>
          </div>
          <h1 className={cancelled ? "text-2xl font-semibold tracking-tight line-through decoration-muted-foreground" : "text-2xl font-semibold tracking-tight"}>
            {shoot.title}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(shoot.date))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatTime(shoot.callTime)} — {formatTime(shoot.wrapTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {shoot.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" />
              {shoot.assignments.length} crew
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="size-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit shoot</DialogTitle>
                <DialogDescription>Update shoot details.</DialogDescription>
              </DialogHeader>
              <ShootForm
                action={updateShoot.bind(null, shoot.id)}
                shoot={shoot}
                submitLabel="Save changes"
                assignments={shoot.assignments}
                sameDayShoots={sameDayShoots}
              />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this shoot?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the shoot and all crew assignments. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => startTransition(async () => deleteShoot(shoot.id))}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {shoot.notes && (
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="text-sm whitespace-pre-wrap text-foreground/90">{shoot.notes}</p>
        </div>
      )}

      {Array.from(conflictsByAssignment.entries()).map(([assignmentId, conflicts]) => {
        const person = shoot.assignments.find((a) => a.id === assignmentId)?.user.name;
        return (
          <div key={assignmentId} className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium">
                {person} is double-booked — this assignment conflicts with:
              </p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    <Link href={`/dashboard/shoots/${c.shoot.id}`} className="font-medium text-foreground hover:underline">
                      {c.shoot.title}
                    </Link>{" "}
                    ({c.role}) · {formatTime(c.shoot.callTime)} — {formatTime(c.shoot.wrapTime)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Crew</h2>
          <AssignCrewDialog
            shootId={shoot.id}
            shootCallTime={shoot.callTime}
            shootWrapTime={shoot.wrapTime}
            staff={staff}
            roles={roles}
            existingUserIds={existingUserIds}
            sameDayShoots={sameDayShoots}
          />
        </div>

        {shoot.assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
            <Users className="mb-3 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No crew assigned yet</p>
            <p className="text-xs text-muted-foreground">Add crew members to build the call sheet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crew</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shoot.assignments.map((a) => {
                  const conflicts = conflictsByAssignment.get(a.id) ?? [];
                  return (
                    <TableRow key={a.id} className={conflicts.length > 0 ? "bg-amber-500/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">{initials(a.user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{a.user.name}</p>
                            <p className="text-xs text-muted-foreground">{a.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{a.role}</TableCell>
                      <TableCell>
                        <Select
                          value={a.status}
                          onValueChange={(v) => changeStatus(a.id, v as AssignmentStatus)}
                          disabled={pending}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="TENTATIVE">Tentative</SelectItem>
                            <SelectItem value="DECLINED">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(a.id)}
                          disabled={pending}
                          aria-label={`Remove ${a.user.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}