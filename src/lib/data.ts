import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/session";
import type { AssignmentStatus, ShootStatus } from "@prisma/client";

export const assignmentUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
} as const;

export type MyAssignmentClient = {
  id: string;
  role: string;
  status: AssignmentStatus;
  shoot: {
    id: string;
    title: string;
    client: string;
    date: string;
    callTime: string;
    wrapTime: string;
    location: string;
    notes: string | null;
    status: ShootStatus;
  };
};

export async function getAdminData() {
  await requireAdmin();

  const [shoots, staff, roles] = await Promise.all([
    db.shoot.findMany({
      orderBy: [{ date: "asc" }, { callTime: "asc" }],
      include: {
        assignments: {
          include: { user: { select: assignmentUserSelect } },
          orderBy: { role: "asc" },
        },
      },
    }),
    db.user.findMany({
      where: { role: "STAFF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
    db.productionRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return { shoots, staff, roleNames: roles.map((r) => r.name) };
}

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

export async function getShootById(id: string) {
  await requireAdmin();

  return db.shoot.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { user: { select: assignmentUserSelect } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function getMySchedule() {
  const user = await requireUser();

  const assignments = await db.assignment.findMany({
    where: { userId: user.id },
    include: {
      shoot: {
        select: {
          id: true,
          title: true,
          client: true,
          date: true,
          callTime: true,
          wrapTime: true,
          location: true,
          notes: true,
          status: true,
        },
      },
    },
    orderBy: [{ shoot: { date: "asc" } }, { shoot: { callTime: "asc" } }],
  });

  const now = new Date();

  const mapAssignment = (a: (typeof assignments)[number]): MyAssignmentClient => ({
    id: a.id,
    role: a.role,
    status: a.status,
    shoot: {
      id: a.shoot.id,
      title: a.shoot.title,
      client: a.shoot.client,
      date: a.shoot.date.toISOString(),
      callTime: a.shoot.callTime,
      wrapTime: a.shoot.wrapTime,
      location: a.shoot.location,
      notes: a.shoot.notes,
      status: a.shoot.status,
    },
  });

  // Mutually exclusive split: anything ending today or later is upcoming;
  // "past" only includes shoots that finished before today.
  const upcoming = assignments
    .filter((a) => {
      const d = new Date(a.shoot.date);
      d.setHours(23, 59, 59, 999);
      return d >= now && a.shoot.status !== "CANCELLED";
    })
    .map(mapAssignment);
  const past = assignments
    .filter((a) => {
      const d = new Date(a.shoot.date);
      d.setHours(23, 59, 59, 999);
      return d < now;
    })
    .reverse()
    .map(mapAssignment);

  return { user, upcoming, past };
}