"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, LayoutDashboard, Menu, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = isAdmin
    ? [
        { href: "/dashboard", label: "Schedule", icon: LayoutDashboard },
        { href: "/dashboard/team", label: "Team & roles", icon: Users },
        { href: "/dashboard/shoots/new", label: "New shoot", icon: CalendarPlus },
      ]
    : [{ href: "/schedule", label: "My schedule", icon: LayoutDashboard }];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 sm:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <DropdownMenuItem key={link.href} asChild>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={active ? "font-medium text-foreground" : ""}
              >
                <link.icon className="size-4" /> {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}