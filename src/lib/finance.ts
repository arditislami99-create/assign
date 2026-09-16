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
};

export type ClientRevenue = {
  client: string;
  revenue: number;
  pipeline: number;
  shoots: number;
};

export type CategoryTotal = {
  category: ExpenseCategory;
  total: number;
  count: number;
};

/** Amount still owed by the client (never negative). */
export function outstandingOf(shoot: Pick<FinanceShoot, "price" | "amountPaid">): number {
  if (shoot.price == null) return 0;
  return Math.max(0, shoot.price - shoot.amountPaid);
}

export type FinanceSummary = {
  revenue: number;
  pipeline: number;
  totalConfirmed: number;
  totalTentative: number;
  thisMonthRevenue: number;
  thisMonthPipeline: number;
  prevMonthRevenue: number;
  avgShootValue: number;
  noPriceCount: number;
  months: MonthPoint[];
  clients: ClientRevenue[];
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
  const tentative = live.filter((s) => s.status === "TENTATIVE");

  const revenueOf = (list: typeof live) =>
    list.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const revenue = revenueOf(confirmed);
  const pipeline = revenueOf(tentative);

  const thisMonth = monthKey(now);
  const inMonth = (s: FinanceShoot, key: string) => shootMonth(s.date) === key;
  const thisMonthRevenue = revenueOf(confirmed.filter((s) => inMonth(s, thisMonth)));
  const thisMonthPipeline = revenueOf(tentative.filter((s) => inMonth(s, thisMonth)));
  const prevMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthRevenue = revenueOf(confirmed.filter((s) => inMonth(s, prevMonth)));

  const priced = confirmed.filter((s) => s.price != null);
  const avgShootValue = priced.length > 0 ? revenue / priced.length : 0;
  const noPriceCount = live.filter((s) => s.price == null).length;

  const months = lastMonths(6, now);
  const revByMonth = new Map(
    months.map((m) => [m, { confirmed: 0, tentative: 0 }])
  );
  for (const s of live) {
    const bucket = revByMonth.get(shootMonth(s.date));
    if (!bucket) continue;
    if (s.status === "CONFIRMED") bucket.confirmed += s.price ?? 0;
    else bucket.tentative += s.price ?? 0;
  }
  const monthPoints: MonthPoint[] = months.map((key) => ({
    key,
    label: monthLabel(key),
    confirmed: revByMonth.get(key)!.confirmed,
    tentative: revByMonth.get(key)!.tentative,
  }));

  const byClient = new Map<string, ClientRevenue>();
  for (const s of live) {
    const row =
      byClient.get(s.client) ?? { client: s.client, revenue: 0, pipeline: 0, shoots: 0 };
    row.shoots += 1;
    if (s.status === "CONFIRMED") row.revenue += s.price ?? 0;
    else row.pipeline += s.price ?? 0;
    byClient.set(s.client, row);
  }
  const clients = Array.from(byClient.values()).sort(
    (a, b) => b.revenue + b.pipeline - (a.revenue + a.pipeline)
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const outstanding = confirmed.reduce((sum, s) => sum + outstandingOf(s), 0);
  const unpaidCount = confirmed.filter(
    (s) => s.price != null && outstandingOf(s) > 0
  ).length;

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

  return {
    revenue,
    pipeline,
    totalConfirmed: confirmed.length,
    totalTentative: tentative.length,
    thisMonthRevenue,
    thisMonthPipeline,
    prevMonthRevenue,
    avgShootValue,
    noPriceCount,
    months: monthPoints,
    clients,
    totalExpenses,
    expenseCount: expenses.length,
    profit: revenue - totalExpenses,
    outstanding,
    unpaidCount,
    byCategory,
  };
}