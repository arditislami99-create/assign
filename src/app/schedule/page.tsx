import type { Metadata } from "next";

import { ScheduleView } from "@/components/staff/schedule-view";
import { getMySchedule } from "@/lib/data";

export const metadata: Metadata = { title: "My Schedule" };

export default async function SchedulePage() {
  const { user, upcoming, past } = await getMySchedule();

  return (
    <ScheduleView
      name={user.name}
      upcoming={upcoming}
      past={past}
    />
  );
}