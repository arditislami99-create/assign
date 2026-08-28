import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShootDetail } from "@/components/admin/shoot-detail";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { assignmentUserSelect } from "@/lib/data";
import { toClientShoot, toClientStaff } from "@/lib/mappers";

export const metadata: Metadata = { title: "Shoot details" };

export default async function ShootDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const shoot = await db.shoot.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { user: { select: assignmentUserSelect } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!shoot) notFound();

  const [staff, roles, sameDayShoots] = await Promise.all([
    db.user.findMany({
      where: { role: "STAFF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
    db.productionRole.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    db.shoot.findMany({
      where: {
        id: { not: id },
        date: {
          gte: new Date(new Date(shoot.date).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(shoot.date).setHours(23, 59, 59, 999)),
        },
      },
      orderBy: [{ date: "asc" }, { callTime: "asc" }],
      include: {
        assignments: {
          include: { user: { select: assignmentUserSelect } },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <ShootDetail
        shoot={toClientShoot(shoot)}
        staff={staff.map(toClientStaff)}
        sameDayShoots={sameDayShoots.map(toClientShoot)}
        roles={roles.map((r) => r.name)}
      />
    </div>
  );
}