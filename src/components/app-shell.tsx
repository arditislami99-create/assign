import Link from "next/link";

import { Brand } from "@/components/brand";
import { HydrationProbe } from "@/components/hydration-probe";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { requireUser } from "@/lib/session";

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={isAdmin ? "/dashboard" : "/schedule"} className="shrink-0">
              <Brand />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {isAdmin ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Schedule
                  </Link>
                  <Link
                    href="/dashboard/team"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Team
                  </Link>
                  <Link
                    href="/dashboard/shoots/new"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    New shoot
                  </Link>
                </>
              ) : (
                <Link
                  href="/schedule"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  My schedule
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            <MobileNav isAdmin={isAdmin} />
            <ThemeToggle />
            <UserMenu user={user} isAdmin={isAdmin} />
            <HydrationProbe />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}