"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Trash2 } from "lucide-react";

import {
  createExpense,
  deleteExpense,
} from "@/app/actions/expenses";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@/lib/constants";
import { formatDateLabel, formatPrice, toDateKey } from "@/lib/utils";
import type { ClientExpense } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

export function ExpensesManager({
  expenses,
  shoots,
  fixedShootId,
}: {
  expenses: ClientExpense[];
  shoots: { id: string; title: string }[];
  /** When set, new expenses are linked to this shoot and the picker is hidden. */
  fixedShootId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const submit = (formData: FormData) => {
    setError(undefined);
    startTransition(async () => {
      const result = await createExpense(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  };

  const remove = (expense: ClientExpense) => {
    startTransition(async () => {
      await deleteExpense(expense.id, expense.shootId ?? undefined);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {expenses.length} expense{expenses.length === 1 ? "" : "s"} ·{" "}
          <span className="font-medium text-foreground">{formatPrice(total)}</span>
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Add expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add expense</DialogTitle>
              <DialogDescription>
                {fixedShootId
                  ? "Linked to this shoot."
                  : "Optionally link it to a shoot, or leave it general."}
              </DialogDescription>
            </DialogHeader>
            <form action={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-title">Title</Label>
                <Input
                  id="expense-title"
                  name="title"
                  placeholder="e.g. Lighting rental"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount (€)</Label>
                  <Input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    name="date"
                    type="date"
                    defaultValue={toDateKey(new Date())}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select name="category" defaultValue="OTHER">
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fixedShootId ? (
                <input type="hidden" name="shootId" value={fixedShootId} />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="expense-shoot">Shoot (optional)</Label>
                  <Select name="shootId" defaultValue="">
                    <SelectTrigger id="expense-shoot">
                      <SelectValue placeholder="General expense" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General expense</SelectItem>
                      {shoots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="expense-notes">Notes (optional)</Label>
                <Textarea id="expense-notes" name="notes" rows={2} placeholder="Receipt, vendor…" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
          <Receipt className="mb-2 size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium">No expenses yet</p>
          <p className="text-xs text-muted-foreground">
            Track catering, rentals, travel and more.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                {!fixedShootId && <TableHead>Shoot</TableHead>}
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLabel(new Date(e.date))}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{expenseCategoryLabel(e.category)}</Badge>
                  </TableCell>
                  {!fixedShootId && (
                    <TableCell className="text-muted-foreground">
                      {e.shootTitle ?? "General"}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(e.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(e)}
                      disabled={pending}
                      aria-label={`Delete ${e.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
