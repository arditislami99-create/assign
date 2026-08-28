import type { Metadata } from "next";

import { RolesManager, type ManagedRole } from "@/components/admin/roles-manager";
import { StaffManager, type ManagedUser } from "@/components/admin/staff-manager";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const admin = await requireAdmin();

  const [users, roles, roleCounts] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        _count: { select: { assignments: true } },
      },
    }),
    db.productionRole.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.assignment.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const managed: ManagedUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    assignmentCount: u._count.assignments,
  }));

  const countByName = new Map(roleCounts.map((c) => [c.role, c._count._all]));
  const managedRoles: ManagedRole[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    assignmentCount: countByName.get(r.name) ?? 0,
  }));

  return (
    <div className="space-y-10">
      <StaffManager users={managed} currentUserId={admin.id} />
      <div className="border-t pt-8">
        <RolesManager roles={managedRoles} />
      </div>
    </div>
  );
}