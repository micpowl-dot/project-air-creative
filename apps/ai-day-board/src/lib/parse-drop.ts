// Parse The Drop's page content-model into our Schedule shape.
// The schedule lives as an HTML <table> inside rows[0].widgets[0]. The table is
// regular: a header row (Time + 3 tracks), session rows (time + 3 track cells),
// and full-width rows (time + one cell: opening, lunch, closing, social).

import { parse } from "node-html-parser";
import type { Schedule, ScheduleSlot, Session, RoomSet, TrackId } from "./types";

const TRACK_ORDER: TrackId[] = ["explore", "apply", "build"];
type SiteKey = "brookhaven" | "andover" | "newYork";
const SITES: { key: SiteKey; names: string[] }[] = [
  { key: "brookhaven", names: ["Brookhaven"] },
  { key: "andover", names: ["Andover"] },
  { key: "newYork", names: ["New York"] },
];

/** Top-level: content-model JSON -> Schedule. Throws if the table is absent. */
export function parseDropSchedule(model: unknown): Schedule {
  const blob = JSON.stringify((model as { rows?: { widgets?: unknown[] }[] })?.rows?.[0]?.widgets?.[0] ?? {});
  const start = blob.indexOf("<table");
  const end = blob.indexOf("</table>");
  if (start < 0 || end < 0) throw new Error("Schedule table not found in page model");
  const html = blob
    .slice(start, end + 8)
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\\//g, "/");
  return gridToSchedule(buildGrid(html));
}

interface Cell {
  lines: string[];
  meetUrl?: string;
}

/** Table -> rows of cells; each cell carries text lines + its Meet link. */
function buildGrid(html: string): Cell[][] {
  const root = parse(html);
  return root.querySelectorAll("tr").map((tr) =>
    tr.querySelectorAll("th,td").map((td) => {
      const href = td.querySelector("a[href]")?.getAttribute("href");
      return {
        lines: td.structuredText
          .split("\n")
          .map((l) => l.replace(/\s+/g, " ").trim())
          .filter(Boolean),
        meetUrl: href ? href.replace(/^http:/, "https:") : undefined,
      };
    })
  );
}

const hasMeet = (lines: string[]) => lines.some((l) => /google meet|\[meet\]|meet\.google/i.test(l));

function parseInstructors(lines: string[]): string[] {
  const line = lines.find((l) => /^instructors?\s*:/i.test(l));
  if (!line) return [];
  return line
    .replace(/^instructors?\s*:/i, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pull "Site: Room" values from session cells. */
function parseRoomsColon(lines: string[]): RoomSet {
  const rooms: RoomSet = {};
  for (const { key, names } of SITES) {
    for (const nm of names) {
      const line = lines.find((l) => new RegExp(`^${nm}\\s*:`, "i").test(l));
      if (line) rooms[key] = line.replace(new RegExp(`^${nm}\\s*:`, "i"), "").replace(/remote.*/i, "").trim();
    }
  }
  if (hasMeet(lines)) rooms.remote = true;
  return rooms;
}

/** Pull rooms from a full-width cell: "Site (Room)" or "Site: Room". */
function parseRoomsLoose(text: string): RoomSet {
  const rooms: RoomSet = {};
  // A "Site: Room" value ends at the next site label, a pipe, or end — so one
  // run-on line like "Brookhaven: X Andover: Y New York: Z" splits correctly.
  const LABELS = [...SITES.flatMap((s) => s.names), "Remote"].join("|");
  for (const { key, names } of SITES) {
    for (const nm of names) {
      const paren = text.match(new RegExp(`${nm}\\s*\\(([^)]+)\\)`, "i"));
      const colon = text.match(new RegExp(`${nm}\\s*:\\s*(.+?)(?=\\s*(?:${LABELS})\\s*:|\\||$)`, "i"));
      if (paren) rooms[key] = paren[1].trim();
      else if (colon) rooms[key] = colon[1].trim();
    }
  }
  if (/google meet|\[meet\]|meet\.google/i.test(text)) rooms.remote = true;
  return rooms;
}

function parseSession(track: TrackId, cell: Cell): Session | null {
  const lines = cell.lines;
  if (!lines.length) return null;
  const title = lines[0];
  const instructors = parseInstructors(lines);
  const rooms = parseRoomsColon(lines);
  if (cell.meetUrl) {
    rooms.meetUrl = cell.meetUrl;
    rooms.remote = true;
  }
  // description = lines after the title, before the "-", instructor, room or remote markers
  const stop = (l: string) => l === "-" || /^(instructors?|brookhaven|andover|new york|remote)\s*:/i.test(l);
  const desc: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (stop(lines[i])) break;
    desc.push(lines[i]);
  }
  return {
    track,
    title,
    description: desc.join(" ") || undefined,
    instructors,
    rooms,
    isRepeat: /\(repeat\)/i.test(title),
  };
}

function gridToSchedule(grid: Cell[][]): Schedule {
  const empty: Cell = { lines: [] };
  // Header row builds tracks (fallback to defaults).
  const header = grid[0] ?? [];
  const tracks = TRACK_ORDER.map((id, i) => {
    const lines = (header[i + 1] ?? empty).lines;
    return { id, name: lines[0] ?? id.toUpperCase(), subtitle: lines[1] ?? "" };
  });

  const slots: ScheduleSlot[] = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row.length) continue;
    const time = (row[0] ?? empty).lines[0] ?? "";
    if (!time) continue;

    if (row.length >= 4) {
      const sessions: Session[] = [];
      TRACK_ORDER.forEach((id, i) => {
        const s = parseSession(id, row[i + 1] ?? empty);
        if (s) sessions.push(s);
      });
      slots.push({ time, kind: "sessions", sessions });
    } else {
      const cell = row[1] ?? empty;
      const text = cell.lines.join(" ");
      const first = cell.lines[0] ?? "";
      const m = first.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
      const title = (m ? m[1] : first).trim();
      const people = m ? m[2].split(/\s*\+\s*|,\s*/).map((p) => p.trim()).filter(Boolean) : [];
      const rooms = parseRoomsLoose(text);
      if (cell.meetUrl) {
        rooms.meetUrl = cell.meetUrl;
        rooms.remote = true;
      }
      slots.push({ time, kind: "full", title, people, rooms });
    }
  }

  return {
    title: "AI Day (US) — June 9, 2026",
    date: "2026-06-09",
    sourceUrl: "https://thedrop.weather.com/pages/1jp62gi1i768q7m567/AiDayUsJune9th2026/1jp62mt88cuvqkhh7b",
    lastSynced: new Date().toISOString(),
    tracks,
    slots,
  };
}
