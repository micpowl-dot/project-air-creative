import { Wall } from "@/components/Wall";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

export const metadata = { title: "AI Helped Me… — AI Day Live Wall" };

export default function WallPage() {
  return <Wall schedule={schedule} />;
}
