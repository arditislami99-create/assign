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