import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getAdminData } from "@/lib/data";
import { toClientShoot } from "@/lib/mappers";
import { formatPrice } from "@/lib/utils";
import { lastMonths, monthLabel, shootMonth } from "@/lib/finance";
import { shootStatusInfo } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancePage() {
  const { shoots } = await getAdminData();
  const all = shoots.map(toClientShoot);

  const live = all.filter((s) => s.status !== "CANCELLED");
  const confirmed = live.filter((s) => s.status === "CONFIRMED");
  const tentative = live.filter((s) => s.status === "TENTATIVE");

  const revenueOf = (list: typeof live) =>
    list.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const revenue = revenueOf(confirmed);
  const pipeline = revenueOf(tentative);
  const noPrice = live.filter((s) => s.price == null).length;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthRevenue = live
    .filter((s) => shootMonth(s.date) === thisMonth)
    .reduce((sum, s) => sum + (s.price ?? 0), 0);

  const months = lastMonths(6);
  const revByMonth = new Map(months.map((m) => [m, 0]));
  for (const s of live) {
    const key = shootMonth(s.date);
    if (!revByMonth.has(key)) continue;
    revByMonth.set(key, (revByMonth.get(key) ?? 0) + (s.price ?? 0));
  }
  const maxBar = Math.max(1, ...months.map((m) => revByMonth.get(m) ?? 0));

  const byClient = new Map<string, { revenue: number; shoots: number }>();
  for (const s of live) {
    const row = byClient.get(s.client) ?? { revenue: 0, shoots: 0 };
    row.revenue += s.price ?? 0;
    row.shoots += 1;
    byClient.set(s.client, row);
  }
  const clients = Array.from(byClient.entries()).sort((a, b) => b[1].revenue - a[1].revenue);

  const rows = [...live].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
        <p className="text-sm text-muted-foreground">
          Revenue from shoot charges. Cancelled shoots are excluded.
          {noPrice > 0 && ` ${noPrice} shoot${noPrice === 1 ? "" : "s"} have no price set.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Confirmed revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatPrice(revenue)}</p>
            <p className="text-xs text-muted-foreground">{confirmed.length} shoots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatPrice(thisMonthRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tentative pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatPrice(pipeline)}</p>
            <p className="text-xs text-muted-foreground">{tentative.length} shoots</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue — last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-3 sm:gap-4">
            {months.map((m) => {
              const rev = revByMonth.get(m) ?? 0;
              return (
                <div key={m} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {rev > 0 ? formatPrice(rev) : ""}
                  </span>
                  <div className="flex h-28 w-full max-w-14 items-end overflow-hidden rounded-md bg-muted">
                    <div
                      className="w-full rounded-md bg-primary/80"
                      style={{ height: `${Math.max(rev > 0 ? 4 : 0, (rev / maxBar) * 100)}%` }}
                      title={`Revenue ${formatPrice(rev)}`}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{monthLabel(m)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By client</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Shoots</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No shoots yet.
                  </TableCell>
                </TableRow>
              )}
              {clients.map(([client, row]) => (
                <TableRow key={client}>
                  <TableCell className="font-medium">{client}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.shoots}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shoots</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shoot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Charge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const info = shootStatusInfo(s.status);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/dashboard/shoots/${s.id}`} className="group inline-flex items-center gap-1 font-medium hover:underline">
                        {s.title}
                        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.client}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={info.classes}>{info.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPrice(s.price)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}