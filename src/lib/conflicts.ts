import { db } from "@/lib/db";
import { timesOverlap } from "@/lib/utils";

export type BookingClash = {
  id: string;
  title: string;
  callTime: string;
  wrapTime: string;
  location: string;
};

export type BookingClashes = {
  /** Other bookings whose times overlap this shoot. */
  overlapping: BookingClash[];
  /** Other bookings on the same day that do not overlap in time. */
  sameDayOnly: BookingClash[];
};

export async function findBookingClashes(opts: {
  userId: string;
  date: Date;
  callTime: string;
  wrapTime: string;
}): Promise<BookingClashes> {
  const start = new Date(opts.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(opts.date);
  end.setHours(23, 59, 59, 999);

  const assignments = await db.assignment.findMany({
    where: {
      userId: opts.userId,
      shoot: {
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
    },
    include: {
      shoot: {
        select: { id: true, title: true, callTime: true, wrapTime: true, location: true },
      },
    },
  });

  const overlapping: BookingClash[] = [];
  const sameDayOnly: BookingClash[] = [];

  for (const a of assignments) {
    const clash: BookingClash = {
      id: a.shoot.id,
      title: a.shoot.title,
      callTime: a.shoot.callTime,
      wrapTime: a.shoot.wrapTime,
      location: a.shoot.location,
    };
    if (timesOverlap(opts.callTime, opts.wrapTime, a.shoot.callTime, a.shoot.wrapTime)) {
      overlapping.push(clash);
    } else {
      sameDayOnly.push(clash);
    }
  }

  return { overlapping, sameDayOnly };
}