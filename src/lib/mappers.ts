import type { AdminData } from "@/lib/data";
import type { ClientExpense, ClientShoot, ClientStaff } from "@/lib/types";

function mapDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return d;
}

export function toClientShoot(shoot: AdminData["shoots"][number]): ClientShoot {
  return {
    id: shoot.id,
    title: shoot.title,
    client: shoot.client,
    date: mapDate(shoot.date),
    callTime: shoot.callTime,
    wrapTime: shoot.wrapTime,
    location: shoot.location,
    notes: shoot.notes,
    price: shoot.price,
    amountPaid: shoot.amountPaid,
    status: shoot.status,
    expenses: shoot.expenses.map(toClientExpense),
    assignments: shoot.assignments.map((a) => ({
      id: a.id,
      role: a.role,
      status: a.status,
      user: {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        phone: a.user.phone,
        role: a.user.role,
      },
    })),
  };
}

export function toClientStaff(staff: AdminData["staff"][number]): ClientStaff {
  return { ...staff };
}

export function toClientExpense(
  expense: Omit<AdminData["expenses"][number], "shoot"> & {
    shoot?: { title: string } | null;
  }
): ClientExpense {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: mapDate(expense.date),
    notes: expense.notes,
    shootId: expense.shootId,
    shootTitle: expense.shoot?.title,
  };
}