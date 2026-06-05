import { Board } from "@/components/Board";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

// Phase 2 will repoint this to the mirrored data the sync job refreshes.
// For now we read the committed snapshot of the live chart.
const schedule = scheduleData as unknown as Schedule;

// When PUBLIC_BOARD=1 the board is exposed publicly (see proxy.ts); in that
// mode we hide the internal Google Meet join links.
const publicMode = process.env.PUBLIC_BOARD === "1";

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
  const boardSchedule = publicMode ? stripMeetUrls(schedule) : schedule;
  return <Board schedule={boardSchedule} publicMode={publicMode} />;
}
