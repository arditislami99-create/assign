import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import type { ClientShoot } from "@/lib/types";
import { shootStatusInfo } from "@/lib/constants";
import { cn, formatTime } from "@/lib/utils";

export function ShootChip({ shoot, compact = false }: { shoot: ClientShoot; compact?: boolean }) {
  const info = shootStatusInfo(shoot.status);
  const cancelled = shoot.status === "CANCELLED";

  return (
    <Link
      href={`/dashboard/shoots/${shoot.id}`}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md border px-1.5 py-1 text-left transition-colors hover:brightness-95 dark:hover:brightness-125",
        info.classes,
        cancelled && "opacity-50 line-through decoration-muted-foreground"
      )}
      title={`${shoot.title} · ${formatTime(shoot.callTime)} — ${formatTime(shoot.wrapTime)}`}
    >
      {cancelled ? (
        <CalendarX2 className="size-3 shrink-0" />
      ) : (
        <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums">
          {formatTime(shoot.callTime)}
        </span>
      )}
      {!compact && (
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{shoot.title}</span>
      )}
    </Link>
  );
}