"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Schedule" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/finance", label: "Finances" },
  { href: "/dashboard/shoots/new", label: "New shoot" },
];

const ACTIVE =
  "rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted";
const IDLE =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  if (!isAdmin) {
    return (
      <Link href="/schedule" className={ACTIVE}>
        My schedule
      </Link>
    );
  }

  return (
    <>
      {ADMIN_LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? ACTIVE : IDLE}>
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
