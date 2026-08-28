import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminData } from "@/lib/data";
import { toClientShoot, toClientStaff } from "@/lib/mappers";

export const metadata: Metadata = { title: "Schedule" };

export default async function DashboardPage() {
  const { shoots, staff, roleNames } = await getAdminData();

  return (
    <AdminDashboard
      shoots={shoots.map(toClientShoot)}
      staff={staff.map(toClientStaff)}
      roles={roleNames}
    />
  );
}