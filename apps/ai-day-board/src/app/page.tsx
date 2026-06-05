import { Board } from "@/components/Board";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

// Phase 2 will repoint this to the mirrored data the sync job refreshes.
// For now we read the committed snapshot of the live chart.
const schedule = scheduleData as unknown as Schedule;

// When PUBLIC_BOARD=1 the board is exposed publicly (see proxy.ts); in that
// mode we hide the internal Google Meet join links.
const publicMode = process.env.PUBLIC_BOARD === "1";

export default function Home() {
  return <Board schedule={schedule} publicMode={publicMode} />;
}
