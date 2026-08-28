import type { AssignmentStatus, Role, ShootStatus } from "@prisma/client";

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
  status: ShootStatus;
  assignments: ClientAssignment[];
};

export type ClientStaff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};