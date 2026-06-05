import { Board } from "@/components/Board";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

// Phase 2 will repoint this to the mirrored data the sync job refreshes.
// For now we read the committed snapshot of the live chart.
const schedule = scheduleData as unknown as Schedule;

// Hiding the Google Meet links is its OWN switch, independent of public access
// (PUBLIC_BOARD in proxy.ts). Meets are locked to org members ("Trusted") per
// Michele K., so the board can be public WITH links live; set HIDE_MEET_LINKS=1
// only if we need to pull them again (e.g., Dan asks).
const hideMeet = process.env.HIDE_MEET_LINKS === "1";

// Strip every Google Meet URL server-side so they never reach the public
// client (hiding the link in the UI isn't enough — the data still ships).
function stripMeetUrls(s: Schedule): Schedule {
  return {
    ...s,
    slots: s.slots.map((slot) => {
      const next = { ...slot } as typeof slot & { rooms?: Record<string, unknown>; sessions?: { rooms?: Record<string, unknown> }[] };
      if (next.rooms) next.rooms = { ...next.rooms, meetUrl: undefined };
      if (next.sessions) {
        next.sessions = next.sessions.map((sess) => ({
          ...sess,
          rooms: sess.rooms ? { ...sess.rooms, meetUrl: undefined } : sess.rooms,
        }));
      }
      return next;
    }),
  };
}

export default function Home() {
  const boardSchedule = hideMeet ? stripMeetUrls(schedule) : schedule;
  return <Board schedule={boardSchedule} publicMode={hideMeet} />;
}
