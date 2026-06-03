import { PosterStudio } from "@/components/PosterStudio";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

export default function ProfilePage() {
  return <PosterStudio schedule={schedule} fixedFormat="square" title="Profile Studio" />;
}
