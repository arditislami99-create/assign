import type { AssignmentStatus, ExpenseCategory, Role, ShootStatus } from "@prisma/client";

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
};

export type ClientAssignment = {
  id: string;
  role: string;
  status: AssignmentStatus;
  user: ClientUser;
};

export type ClientShoot = {
  id: string;
  title: string;
  client: string;
  date: string;
  callTime: string;
  wrapTime: string;
  location: string;
  notes: string | null;
  price: number | null;
  amountPaid: number;
  status: ShootStatus;
  assignments: ClientAssignment[];
  expenses: ClientExpense[];
};

export type ClientExpense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string | null;
  shootId: string | null;
  shootTitle?: string;
};

export type ClientStaff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};