import { AppShell } from "@/components/app-shell";

export default function ScheduleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}