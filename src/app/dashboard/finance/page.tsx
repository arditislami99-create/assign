import type { Metadata } from "next";

import { getAdminData } from "@/lib/data";
import { toClientShoot, toClientExpense } from "@/lib/mappers";
import { formatPrice } from "@/lib/utils";
import { expenseCategoryLabel } from "@/lib/constants";
import { summarizeFinance } from "@/lib/finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesManager } from "@/components/admin/expenses-manager";
import { RevenueTable } from "./revenue-table";
import { ShootsFinanceTable } from "./shoots-table";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancePage() {
  const { shoots, expenses } = await getAdminData();
  const all = shoots.map(toClientShoot);
  const allExpenses = expenses.map(toClientExpense);
  const summary = summarizeFinance(all, allExpenses);

  const statCards = [
    {
      title: "Confirmed revenue",
      value: formatPrice(summary.revenue),
      sub: `${summary.totalConfirmed} shoot${summary.totalConfirmed === 1 ? "" : "s"}`,
    },
    {
      title: "Expenses",
      value: formatPrice(summary.totalExpenses),
      sub: `${summary.expenseCount} item${summary.expenseCount === 1 ? "" : "s"}`,
    },
    {
      title: "Profit",
      value: formatPrice(summary.profit),
      sub:
        summary.revenue > 0
          ? `${Math.round((summary.profit / summary.revenue) * 100)}% margin`
          : "no revenue yet",
    },
    {
      title: "Outstanding",
      value: formatPrice(summary.outstanding),
      sub:
        summary.unpaidCount === 0
          ? "all collected"
          : `${summary.unpaidCount} unpaid shoot${summary.unpaidCount === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
        <p className="text-sm text-muted-foreground">
          Revenue from shoot charges. Cancelled shoots are excluded.
          {summary.noPriceCount > 0 &&
            ` ${summary.noPriceCount} shoot${summary.noPriceCount === 1 ? "" : "s"} have no price set.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden py-0">
        <RevenueTable months={summary.months} years={summary.years} />
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs expenses, last 6 months</CardTitle>
            <CardDescription>
              Left bar: confirmed + tentative revenue. Right bar: expenses. Label: profit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2 sm:gap-3">
              {summary.months.map((m) => {
                const max = Math.max(
                  1,
                  ...summary.months.flatMap((x) => [x.confirmed + x.tentative, x.expenses])
                );
                const revenue = m.confirmed + m.tentative;
                const confirmedPct = (m.confirmed / max) * 100;
                const tentativePct = (m.tentative / max) * 100;
                const expensesPct = (m.expenses / max) * 100;
                const profitable = m.profit >= 0;
                return (
                  <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span
                      className={
                        revenue + m.expenses > 0
                          ? profitable
                            ? "text-[11px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                            : "text-[11px] font-medium tabular-nums text-rose-600 dark:text-rose-400"
                          : "text-[11px] tabular-nums text-transparent"
                      }
                    >
                      {formatPrice(m.profit)}
                    </span>
                    <div className="flex h-32 w-full max-w-16 items-end justify-center gap-1">
                      <div
                        className="flex w-full max-w-7 flex-col justify-end overflow-hidden rounded-md bg-muted"
                        style={{ height: "100%" }}
                      >
                        {m.tentative > 0 && (
                          <div
                            className="w-full bg-amber-500/40"
                            style={{ height: `${Math.max(2, tentativePct)}%` }}
                            title={`Tentative ${formatPrice(m.tentative)}`}
                          />
                        )}
                        {m.confirmed > 0 && (
                          <div
                            className="w-full bg-primary/80"
                            style={{ height: `${Math.max(4, confirmedPct)}%` }}
                            title={`Confirmed ${formatPrice(m.confirmed)}`}
                          />
                        )}
                      </div>
                      <div
                        className="flex w-full max-w-7 flex-col justify-end overflow-hidden rounded-md bg-muted"
                        style={{ height: "100%" }}
                      >
                        {m.expenses > 0 && (
                          <div
                            className="w-full bg-rose-500/70"
                            style={{ height: `${Math.max(4, expensesPct)}%` }}
                            title={`Expenses ${formatPrice(m.expenses)}`}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary/80" /> Confirmed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-500/40" /> Tentative
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-rose-500/70" /> Expenses
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yearly revenue</CardTitle>
            <CardDescription>
              Confirmed revenue vs expenses per year. Label: profit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-4 sm:gap-6">
              {summary.years.map((y) => {
                const max = Math.max(
                  1,
                  ...summary.years.flatMap((x) => [x.confirmed + x.tentative, x.expenses])
                );
                const revenue = y.confirmed + y.tentative;
                const confirmedPct = (y.confirmed / max) * 100;
                const tentativePct = (y.tentative / max) * 100;
                const expensesPct = (y.expenses / max) * 100;
                const profitable = y.profit >= 0;
                return (
                  <div key={y.year} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span
                      className={
                        revenue + y.expenses > 0
                          ? profitable
                            ? "text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                            : "text-xs font-medium tabular-nums text-rose-600 dark:text-rose-400"
                          : "text-xs tabular-nums text-transparent"
                      }
                    >
                      {formatPrice(y.profit)}
                    </span>
                    <div className="flex h-32 w-full max-w-28 items-end justify-center gap-1.5">
                      <div className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-md bg-muted" style={{ height: "100%" }}>
                        {y.tentative > 0 && (
                          <div
                            className="w-full bg-amber-500/40"
                            style={{ height: `${Math.max(2, tentativePct)}%` }}
                            title={`Tentative ${formatPrice(y.tentative)}`}
                          />
                        )}
                        {y.confirmed > 0 && (
                          <div
                            className="w-full bg-primary/80"
                            style={{ height: `${Math.max(4, confirmedPct)}%` }}
                            title={`Confirmed ${formatPrice(y.confirmed)}`}
                          />
                        )}
                      </div>
                      <div className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-md bg-muted" style={{ height: "100%" }}>
                        {y.expenses > 0 && (
                          <div
                            className="w-full bg-rose-500/70"
                            style={{ height: `${Math.max(4, expensesPct)}%` }}
                            title={`Expenses ${formatPrice(y.expenses)}`}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{y.year}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary/80" /> Confirmed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-500/40" /> Tentative
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-rose-500/70" /> Expenses
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by category</CardTitle>
            <CardDescription>
              Shoot-linked and general expenses combined.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {summary.byCategory.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {summary.byCategory.slice(0, 8).map((c) => {
                  const top = summary.byCategory[0].total;
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-medium">
                          {expenseCategoryLabel(c.category)}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatPrice(c.total)}
                          <span className="ml-2 text-xs">
                            {c.count} item{c.count === 1 ? "" : "s"}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-rose-500/70"
                          style={{ width: `${top > 0 ? (c.total / top) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses</CardTitle>
            <CardDescription>
              Add shoot costs or general overhead. Deleting a shoot removes its expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesManager
              expenses={allExpenses}
              shoots={all
                .filter((s) => s.status !== "CANCELLED")
                .map((s) => ({ id: s.id, title: s.title }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden py-0">
        <ShootsFinanceTable
          shoots={all.map((s) => ({
            id: s.id,
            title: s.title,
            client: s.client,
            date: s.date,
            price: s.price,
            amountPaid: s.amountPaid,
            status: s.status,
          }))}
        />
      </Card>
    </div>
  );
}
