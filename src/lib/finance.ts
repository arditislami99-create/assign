import type { ExpenseCategory } from "@prisma/client";

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

/** Last n calendar months (oldest first) as yyyy-MM keys. */
export function lastMonths(n: number, from = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(monthKey(m));
  }
  return out;
}

/** Local yyyy-MM key for a shoot date ISO string. */
export function shootMonth(dateIso: string): string {
  const d = new Date(dateIso);
  return monthKey(d);
}

export type FinanceShoot = {
  id: string;
  title: string;
  client: string;
  date: string;
  price: number | null;
  amountPaid: number;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
};

export type FinanceExpense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  shootId: string | null;
};

export type MonthPoint = {
  key: string;
  label: string;
  confirmed: number;
  tentative: number;
  expenses: number;
  profit: number;
};

export type YearPoint = {
  year: number;
  confirmed: number;
  tentative: number;
  expenses: number;
  profit: number;
};

/** Amount still owed by the client (never negative). */
export function outstandingOf(shoot: Pick<FinanceShoot, "price" | "amountPaid">): number {
  if (shoot.price == null) return 0;
  return Math.max(0, shoot.price - shoot.amountPaid);
}

export type CategoryTotal = {
  category: ExpenseCategory;
  total: number;
  count: number;
};

/** Calendar year for a shoot/expense date ISO string. */
export function yearOf(dateIso: string): number {
  return new Date(dateIso).getFullYear();
}

export type FinanceSummary = {
  revenue: number;
  totalConfirmed: number;
  noPriceCount: number;
  months: MonthPoint[];
  years: YearPoint[];
  totalExpenses: number;
  expenseCount: number;
  profit: number;
  outstanding: number;
  unpaidCount: number;
  byCategory: CategoryTotal[];
};

export function summarizeFinance(
  shoots: FinanceShoot[],
  expenses: FinanceExpense[] = [],
  now = new Date()
): FinanceSummary {
  const live = shoots.filter((s) => s.status !== "CANCELLED");
  const confirmed = live.filter((s) => s.status === "CONFIRMED");

  const revenueOf = (list: typeof live) =>
    list.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const revenue = revenueOf(confirmed);

  const noPriceCount = live.filter((s) => s.price == null).length;

  const months = lastMonths(6, now);
  const revByMonth = new Map(
    months.map((m) => [m, { confirmed: 0, tentative: 0, expenses: 0 }])
  );
  for (const s of live) {
    const bucket = revByMonth.get(shootMonth(s.date));
    if (!bucket) continue;
    if (s.status === "CONFIRMED") bucket.confirmed += s.price ?? 0;
    else bucket.tentative += s.price ?? 0;
  }
  for (const e of expenses) {
    const bucket = revByMonth.get(shootMonth(e.date));
    if (!bucket) continue;
    bucket.expenses += e.amount;
  }
  const monthPoints: MonthPoint[] = months.map((key) => {
    const b = revByMonth.get(key)!;
    return {
      key,
      label: monthLabel(key),
      confirmed: b.confirmed,
      tentative: b.tentative,
      expenses: b.expenses,
      profit: b.confirmed - b.expenses,
    };
  });

  const byCategoryMap = new Map<string, CategoryTotal>();
  for (const e of expenses) {
    const row = byCategoryMap.get(e.category) ?? {
      category: e.category,
      total: 0,
      count: 0,
    };
    row.total += e.amount;
    row.count += 1;
    byCategoryMap.set(e.category, row);
  }
  const byCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const outstanding = confirmed.reduce((sum, s) => sum + outstandingOf(s), 0);
  const unpaidCount = confirmed.filter(
    (s) => s.price != null && outstandingOf(s) > 0
  ).length;

  const currentYear = now.getFullYear();
  const yearKeys = [currentYear - 2, currentYear - 1, currentYear];
  const revByYear = new Map(
    yearKeys.map((y) => [y, { confirmed: 0, tentative: 0, expenses: 0 }])
  );
  for (const s of live) {
    const bucket = revByYear.get(yearOf(s.date));
    if (!bucket) continue;
    if (s.status === "CONFIRMED") bucket.confirmed += s.price ?? 0;
    else bucket.tentative += s.price ?? 0;
  }
  for (const e of expenses) {
    const bucket = revByYear.get(yearOf(e.date));
    if (!bucket) continue;
    bucket.expenses += e.amount;
  }
  const years: YearPoint[] = yearKeys.map((year) => {
    const b = revByYear.get(year)!;
    return {
      year,
      confirmed: b.confirmed,
      tentative: b.tentative,
      expenses: b.expenses,
      profit: b.confirmed - b.expenses,
    };
  });

  return {
    revenue,
    totalConfirmed: confirmed.length,
    noPriceCount,
    months: monthPoints,
    years,
    totalExpenses,
    expenseCount: expenses.length,
    profit: revenue - totalExpenses,
    outstanding,
    unpaidCount,
    byCategory,
  };
}