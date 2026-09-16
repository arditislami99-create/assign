"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";

import { shootStatusInfo } from "@/lib/constants";
import type { FinanceShoot } from "@/lib/finance";
import { outstandingOf } from "@/lib/finance";
import { formatDateLabel, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FinanceRow = FinanceShoot & { client: string };

type StatusFilter = "ALL" | "CONFIRMED" | "TENTATIVE";

export function ShootsFinanceTable({ shoots }: { shoots: FinanceRow[] }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const rows = useMemo(
    () => [...shoots].sort((a, b) => b.date.localeCompare(a.date)),
    [shoots]
  );

  const filtered = useMemo(
    () => (status === "ALL" ? rows : rows.filter((s) => s.status === status)),
    [rows, status]
  );

  const priced = filtered.filter((s) => s.price != null);
  const subtotal = priced.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const paidTotal = priced.reduce((sum, s) => sum + Math.min(s.amountPaid, s.price ?? 0), 0);
  const outstandingTotal = filtered
    .filter((s) => s.status !== "CANCELLED")
    .reduce((sum, s) => sum + outstandingOf(s), 0);
  const unpriced = filtered.length - priced.length;

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([["ALL", rows.length]]);
    for (const s of rows) {
      if (s.status === "CONFIRMED" || s.status === "TENTATIVE") {
        map.set(s.status, (map.get(s.status) ?? 0) + 1);
      }
    }
    return map;
  }, [rows]);

  return (
    <Tabs
      value={status}
      onValueChange={(v) => setStatus(v as StatusFilter)}
    >
      <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Shoots</h2>
        <TabsList>
          <TabsTrigger value="ALL">All ({counts.get("ALL") ?? 0})</TabsTrigger>
          <TabsTrigger value="CONFIRMED">
            Confirmed ({counts.get("CONFIRMED") ?? 0})
          </TabsTrigger>
          <TabsTrigger value="TENTATIVE">
            Tentative ({counts.get("TENTATIVE") ?? 0})
          </TabsTrigger>
        </TabsList>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Shoot</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Charge</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right pr-4">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="mb-3 size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No shoots in this view</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different status filter.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {filtered.map((s) => {
            const info = shootStatusInfo(s.status);
            const cancelled = s.status === "CANCELLED";
            const balance = cancelled ? 0 : outstandingOf(s);
            return (
              <TableRow key={s.id}>
                <TableCell className="pl-4">
                  <Link
                    href={`/dashboard/shoots/${s.id}`}
                    className="group inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    <span className={cancelled ? "line-through" : undefined}>
                      {s.title}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <p className="text-xs text-muted-foreground">{s.client}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateLabel(new Date(s.date))}
                </TableCell>
                <TableCell>
                  <Badge className={info.classes}>{info.label}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(s.price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {s.price != null ? formatPrice(s.amountPaid) : "—"}
                </TableCell>
                <TableCell
                  className={
                    balance > 0
                      ? "text-right tabular-nums pr-4 font-medium text-amber-600 dark:text-amber-400"
                      : "text-right tabular-nums pr-4 text-muted-foreground"
                  }
                >
                  {s.price != null ? formatPrice(balance) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="pl-4 text-muted-foreground">
              {priced.length} priced shoot{priced.length === 1 ? "" : "s"}
              {unpriced > 0 && ` · ${unpriced} without a price (excluded)`}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatPrice(paidTotal)}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums pr-4">
              {formatPrice(outstandingTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Tabs>
  );
}