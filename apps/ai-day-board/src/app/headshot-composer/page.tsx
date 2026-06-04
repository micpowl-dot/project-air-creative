import { HeadshotComposer } from "@/components/HeadshotComposer";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

export default function HeadshotComposerPage() {
  return <HeadshotComposer schedule={schedule} />;
}
