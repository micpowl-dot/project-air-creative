import { RenderQueue } from "@/components/RenderQueue";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

// Next 16: searchParams is async.
export default async function RenderPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; mode?: string }>;
}) {
  const { focus, mode } = await searchParams;
  return <RenderQueue schedule={schedule} focus={focus} mode={mode === "profiles" ? "profiles" : "sessions"} />;
}
