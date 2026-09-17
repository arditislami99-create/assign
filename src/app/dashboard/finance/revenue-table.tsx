"use client";

import { useMemo, useState } from "react";

import type { MonthPoint, YearPoint } from "@/lib/finance";
import { formatPrice } from "@/lib/utils";
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

type View = "MONTHLY" | "YEARLY";

type Row = {
  label: string;
  confirmed: number;
  tentative: number;
  expenses: number;
  profit: number;
};

export function RevenueTable({
  months,
  years,
}: {
  months: MonthPoint[];
  years: YearPoint[];
}) {
  const [view, setView] = useState<View>("MONTHLY");

  const rows: Row[] = useMemo(
    () =>
      view === "MONTHLY"
        ? months.map((m) => ({
            label: m.label,
            confirmed: m.confirmed,
            tentative: m.tentative,
            expenses: m.expenses,
            profit: m.profit,
          }))
        : years.map((y) => ({
            label: String(y.year),
            confirmed: y.confirmed,
            tentative: y.tentative,
            expenses: y.expenses,
            profit: y.profit,
          })),
    [view, months, years]
  );

  const totals = rows.reduce(
    (acc, r) => ({
      confirmed: acc.confirmed + r.confirmed,
      tentative: acc.tentative + r.tentative,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { confirmed: 0, tentative: 0, expenses: 0, profit: 0 }
  );

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as View)}>
      <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Revenue breakdown</h2>
        <TabsList>
          <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
          <TabsTrigger value="YEARLY">Yearly</TabsTrigger>
        </TabsList>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Period</TableHead>
            <TableHead className="text-right">Confirmed</TableHead>
            <TableHead className="text-right">Tentative</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right pr-4">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.label}>
              <TableCell className="pl-4 font-medium">{r.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(r.confirmed)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatPrice(r.tentative)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(r.confirmed + r.tentative)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatPrice(r.expenses)}
              </TableCell>
              <TableCell
                className={
                  r.profit >= 0
                    ? "pr-4 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                    : "pr-4 text-right font-medium tabular-nums text-rose-600 dark:text-rose-400"
                }
              >
                {formatPrice(r.profit)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="pl-4 text-muted-foreground">Total</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatPrice(totals.confirmed)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatPrice(totals.tentative)}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatPrice(totals.confirmed + totals.tentative)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatPrice(totals.expenses)}
            </TableCell>
            <TableCell className="pr-4 text-right font-semibold tabular-nums">
              {formatPrice(totals.profit)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Tabs>
  );
}
