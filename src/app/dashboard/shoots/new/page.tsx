import type { Metadata } from "next";

import { ShootForm } from "@/components/admin/shoot-form";
import { createShoot } from "@/app/actions/shoots";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New shoot" };

export default async function NewShootPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New shoot</h1>
        <p className="text-sm text-muted-foreground">
          Create a shoot, then assign crew members to roles.
        </p>
      </div>
      <ShootForm action={createShoot} />
    </div>
  );
}