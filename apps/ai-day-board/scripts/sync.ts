/**
 * One-command sync: pull the live AI Day chart from The Drop, save it to
 * src/data/schedule.json, then (unless --local) commit + redeploy so the
 * shared board updates.
 *
 *   npm run sync           pull + save + commit + deploy (share it)
 *   npm run sync -- --local   pull + save only (no deploy)
 *
 * Needs DROP_COOKIE in .env.local (your authenticated thedrop.weather.com
 * session cookie). Copy .env.local.example to .env.local and paste it in.
 * Cookies expire every few hours, so if you get an auth error, refresh it.
 */
import { promises as fs } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parseDropSchedule } from "../src/lib/parse-drop";

const ROOT = path.resolve(import.meta.dirname, "..");
const DROP_ENDPOINT =
  "https://thedrop.weather.com/api/pages/legacy/v1/collections/1jp62gi1i768q7m567/pages/1jp62mt88cuvqkhh7b";

function loadCookie(): string | null {
  if (process.env.DROP_COOKIE) return process.env.DROP_COOKIE;
  try {
    const env = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("DROP_COOKIE="));
    if (!line) return null;
    let v = line.slice(line.indexOf("=") + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v || null;
  } catch {
    return null;
  }
}

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

async function main() {
  const local = process.argv.includes("--local");
  const cookie = loadCookie();
  if (!cookie) {
    console.error(
      "\n✗ No DROP_COOKIE found.\n  1. cp .env.local.example .env.local\n  2. Paste your thedrop.weather.com Cookie header into DROP_COOKIE=\n  3. Run npm run sync again\n"
    );
    process.exit(1);
  }

  console.log("→ Pulling the live chart from The Drop…");
  const res = await fetch(DROP_ENDPOINT, { headers: { Cookie: cookie, Accept: "application/json" }, cache: "no-store" });
  const ctype = res.headers.get("content-type") || "";
  if (!res.ok || !ctype.includes("json")) {
    console.error(`\n✗ The Drop rejected the request (status ${res.status}). Your DROP_COOKIE has probably expired — grab a fresh one and try again.\n`);
    process.exit(1);
  }

  const model = await res.json();
  const schedule = parseDropSchedule(model);
  const file = path.join(ROOT, "src", "data", "schedule.json");
  await fs.writeFile(file, JSON.stringify(schedule, null, 2) + "\n", "utf8");
  const sessions = schedule.slots.reduce((n, s) => n + (s.kind === "sessions" ? s.sessions?.length ?? 0 : 0), 0);
  console.log(`✓ Saved schedule.json — ${schedule.slots.length} time slots, ${sessions} sessions.`);

  if (local) {
    console.log("\n(--local) Skipping deploy. Run `npm run sync` without --local to share it.");
    return;
  }

  console.log("\n→ Sharing it (commit + deploy)…");
  try {
    run(`git add "${file}"`);
    // Only commit if something actually changed.
    const changed = execSync("git status --porcelain " + JSON.stringify(file), { cwd: ROOT }).toString().trim();
    if (changed) {
      run(`git commit -m "Sync AI Day schedule from The Drop"`);
      run(`git push`);
    } else {
      console.log("  (no changes vs last commit — schedule already up to date)");
    }
  } catch (e) {
    console.warn("  ! git step skipped:", String(e));
  }
  run(`npx vercel deploy --prod --scope the-weather-company --yes`);
  console.log("\n✓ Done. Live at https://ai-day-board.vercel.weather.com");
}

main().catch((e) => {
  console.error("\n✗ Sync failed:", e);
  process.exit(1);
});
