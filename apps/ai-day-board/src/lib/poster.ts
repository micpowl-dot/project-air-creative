// Poster design system.
//
// A poster is a 16:9 (1920x1080) TV card built from named SLOTS. Each slot is
// independently toggleable and data-bound, so the same system renders any
// session/speaker by swapping content, and re-skins by swapping a variant.
//
// Mirrors the Figma node "04 — TV Templates / TV Template — Magenta"
// (file cN02srfPOLg8jLZRI9iMiB, node 628-13). Palette + fonts taken from that
// file: primary #fb00ff, accent #ffe500, contrast #000, light #fff; fonts
// Fira Sans Extra Condensed + Fira Code.
//
// Edits vs the Figma example (per Michael): the example has no slot for the
// session TITLE, ROOM, or LOCATION. Those are added here as first-class slots.

import type { Schedule, ScheduleSlot, Session } from "./types";

export type SiteId = "brookhaven" | "andover" | "newYork";

export const SITES: { id: SiteId; label: string }[] = [
  { id: "brookhaven", label: "Brookhaven" },
  { id: "andover", label: "Andover" },
  { id: "newYork", label: "New York" },
];

export interface PosterVariant {
  id: string;
  name: string;
  bg: string; // role: primary (background)
  accent: string; // role: accent (bars, tag, AI DAY logo dynamic color)
  ink: string; // role: contrast (name/title text, logo dark paths)
  light: string; // role: light (date, info row, logo light paths)
}

// Exact swatch collections from the Project AIR design system
// (Figma cN02srfPOLg8jLZRI9iMiB — palette/<name>). Roles: primary, accent,
// contrast, light. Note: "contrast" is navy #0D142A ("our blue") for most,
// not pure black.
export const POSTER_VARIANTS: PosterVariant[] = [
  { id: "magenta", name: "Magenta", bg: "#FB00FF", accent: "#FFE500", ink: "#0D142A", light: "#FFFFFF" },
  { id: "cyan", name: "Cyan", bg: "#0062FF", accent: "#67FAE0", ink: "#0D142A", light: "#FFFFFF" },
  { id: "violet", name: "Violet", bg: "#46125B", accent: "#FFDC14", ink: "#9E5BB9", light: "#FFFFFF" },
  { id: "amber", name: "Amber", bg: "#FF9500", accent: "#6B0800", ink: "#BC1100", light: "#FFE8C1" },
  { id: "forest", name: "Forest", bg: "#1F7A4D", accent: "#76D662", ink: "#0D142A", light: "#FFFFFF" },
];

export function getVariant(id: string): PosterVariant {
  return POSTER_VARIANTS.find((v) => v.id === id) ?? POSTER_VARIANTS[0];
}

// Real element art lives in /public/poster-elements (from the Project Air
// elements folder). These are the swappable shape options for two slots.
export const RING_STYLES = [
  "clover",
  "circle",
  "star",
  "sunburst",
  "diamond",
  "hexagon",
] as const;
export type RingStyle = (typeof RING_STYLES)[number];

export const TOP_STYLES = [
  "piano-stripes",
  "converging",
  "dot-row",
  "checker",
] as const;
export type TopStyle = (typeof TOP_STYLES)[number];

export const DEFAULT_RING_STYLE: RingStyle = "clover";
export const DEFAULT_TOP_STYLE: TopStyle = "piano-stripes";

/** Which slots are switched on for a given poster. */
export interface PosterSlots {
  date: boolean;
  eventMark: boolean;
  portrait: boolean;
  ringBadge: boolean;
  name: boolean;
  role: boolean; // person's job title — NOT in the chart; override-only
  sessionTitle: boolean; // ADDED slot
  tag: boolean; // track designation
  location: boolean; // ADDED slot
  room: boolean; // ADDED slot
  time: boolean;
  lockup: boolean;
}

export const DEFAULT_SLOTS: PosterSlots = {
  date: true,
  eventMark: true,
  portrait: true,
  ringBadge: true,
  name: true,
  role: false,
  sessionTitle: true,
  tag: true,
  location: true,
  room: true,
  time: true,
  lockup: true,
};

/** Everything a poster can show. Any field may be overridden by hand. */
export interface PosterData {
  dateLabel: string; // "JUNE.9.2026"
  eventTitle: string; // "AI DAY"
  name: string; // speaker (drives headshot lookup too)
  role?: string; // job title — not in chart; optional override
  sessionTitle: string;
  tag: string; // e.g. track name
  location: string; // site label
  room: string; // room at that site
  time: string;
}

const DATE_LABEL = "JUNE.9.2026";

/** Build poster data for one session at one site, with optional overrides. */
export function sessionToPoster(
  session: Session,
  site: SiteId,
  time: string,
  overrides: Partial<PosterData> = {}
): PosterData {
  const siteLabel = SITES.find((s) => s.id === site)?.label ?? "";
  return {
    dateLabel: DATE_LABEL,
    eventTitle: "AI DAY",
    name: session.instructors[0] ?? "",
    sessionTitle: session.title,
    tag: trackTag(session.track),
    location: siteLabel,
    room: session.rooms[site] ? String(session.rooms[site]) : "TBD",
    time,
    ...overrides,
  };
}

function trackTag(track: Session["track"]): string {
  return { explore: "EXPLORE", apply: "APPLY", build: "BUILD" }[track];
}

export interface PosterEntry {
  id: string;
  session: Session;
  time: string;
}

/** Flatten the schedule into one poster entry per (session, instructor head). */
export function posterEntriesFromSchedule(schedule: Schedule): PosterEntry[] {
  const out: PosterEntry[] = [];
  for (const slot of schedule.slots) {
    if (slot.kind !== "sessions" || !slot.sessions) continue;
    for (const session of slot.sessions) {
      out.push({
        id: `${slot.time}-${session.track}`,
        session,
        time: slot.time,
      });
    }
  }
  return out;
}

export type { ScheduleSlot };
