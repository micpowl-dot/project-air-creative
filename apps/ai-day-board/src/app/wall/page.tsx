import { Wall } from "@/components/Wall";
import type { Schedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

const schedule = scheduleData as unknown as Schedule;

export const metadata = { title: "AI Helped Me… — AI Day Live Wall" };

// The screen token is read here, server-side, and passed down. Reading it from
// window in the component instead would make the server render a tokenless QR
// that 401s before hydration patches it.
export default async function WallPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = sp.screen;
  const screen = typeof raw === "string" ? raw : "";
  return <Wall schedule={schedule} screen={screen} />;
}
