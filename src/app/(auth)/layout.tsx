import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4 py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <Brand className="mb-8" />
      {children}
    </div>
  );
}