import { HeadshotRenderQueue } from "@/components/HeadshotRenderQueue";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

export default function HeadshotRenderPage() {
  return <HeadshotRenderQueue schedule={schedule} />;
}
