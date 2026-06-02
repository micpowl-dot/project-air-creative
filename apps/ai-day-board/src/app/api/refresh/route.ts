import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDropSchedule } from "@/lib/parse-drop";

const DROP_ENDPOINT =
  "https://thedrop.weather.com/api/pages/legacy/v1/collections/1jp62gi1i768q7m567/pages/1jp62mt88cuvqkhh7b";

// Pull the live chart from The Drop, parse it, persist the snapshot, return it.
// The Drop is behind SSO, so a session cookie must be supplied via the
// DROP_COOKIE env var (.env.local). Without it we return a clear "not connected"
// state the UI can surface.
export async function GET() {
  const cookie = process.env.DROP_COOKIE;
  if (!cookie) {
    return Response.json(
      {
        error: "not_connected",
        message:
          "The Drop isn't connected. Add DROP_COOKIE to .env.local (your authenticated thedrop.weather.com session cookie), then restart the dev server.",
      },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(DROP_ENDPOINT, {
      headers: { Cookie: cookie, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (e) {
    return Response.json({ error: "fetch_failed", message: String(e) }, { status: 502 });
  }

  const ctype = res.headers.get("content-type") || "";
  if (!res.ok || !ctype.includes("json")) {
    return Response.json(
      {
        error: "auth",
        message:
          "The Drop rejected the request (likely an expired session cookie). Refresh DROP_COOKIE in .env.local.",
        status: res.status,
      },
      { status: 401 }
    );
  }

  let schedule;
  try {
    const model = await res.json();
    schedule = parseDropSchedule(model);
  } catch (e) {
    return Response.json({ error: "parse_failed", message: String(e) }, { status: 500 });
  }

  // Best-effort persist so reloads and the render queue see fresh data (local dev).
  try {
    const file = path.join(process.cwd(), "src", "data", "schedule.json");
    await fs.writeFile(file, JSON.stringify(schedule, null, 2) + "\n", "utf8");
  } catch {
    /* read-only FS (e.g. Vercel) — the client still gets the fresh data below */
  }

  return Response.json({ ok: true, schedule });
}
