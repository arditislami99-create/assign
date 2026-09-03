"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

/**
 * Temporary diagnostic: green dot = client JS hydrated and running,
 * gray dot = page rendered but JS never executed (taps will do nothing).
 */
export function HydrationProbe() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <span
      title={hydrated ? "App is interactive" : "App is still loading…"}
      aria-label={hydrated ? "App is interactive" : "App is still loading"}
      className={cn(
        "size-1.5 rounded-full",
        hydrated ? "bg-emerald-500" : "bg-muted-foreground/40"
      )}
    />
  );
}