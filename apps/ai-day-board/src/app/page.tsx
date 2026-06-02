import { Board } from "@/components/Board";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

// Phase 2 will repoint this to the mirrored data the sync job refreshes.
// For now we read the committed snapshot of the live chart.
const schedule = scheduleData as unknown as Schedule;

export default function Home() {
  return <Board schedule={schedule} />;
}
