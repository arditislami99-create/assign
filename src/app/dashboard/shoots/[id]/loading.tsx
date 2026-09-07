import { Skeleton } from "@/components/ui/skeleton";

export default function ShootDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}