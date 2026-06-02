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
  bg: string; // primary background
  accent: string; // highlight (bars, tag, accents)
  ink: string; // primary text / contrast motifs
  light: string; // light text / motifs
  /** colors used for the concentric ring badge, outermost -> in. */
  ringColors: string[];
}

// "Magenta" is the exact Figma variant. The others reuse the same 4-token
// structure in the festival expansion direction (see brand-guidelines.md).
export const POSTER_VARIANTS: PosterVariant[] = [
  {
    id: "magenta",
    name: "Magenta",
    bg: "#fb00ff",
    accent: "#ffe500",
    ink: "#000000",
    light: "#ffffff",
    ringColors: ["#000000", "#ffffff", "#000000", "#ffffff", "#000000"],
  },
  {
    id: "cyan",
    name: "Electric Cyan",
    bg: "#14c8e6",
    accent: "#ff2e9a",
    ink: "#06222b",
    light: "#ffffff",
    ringColors: ["#06222b", "#ffffff", "#06222b", "#ffffff", "#06222b"],
  },
  {
    id: "amber",
    name: "Hot Amber",
    bg: "#ff9e1b",
    accent: "#2b1b6b",
    ink: "#1a1003",
    light: "#fff7e8",
    ringColors: ["#1a1003", "#fff7e8", "#1a1003", "#fff7e8", "#1a1003"],
  },
  {
    id: "purple",
    name: "Deep Purple",
    bg: "#5b16a8",
    accent: "#ffe500",
    ink: "#0e0320",
    light: "#f3e8ff",
    ringColors: ["#0e0320", "#f3e8ff", "#0e0320", "#f3e8ff", "#0e0320"],
  },
];

export function getVariant(id: string): PosterVariant {
  return POSTER_VARIANTS.find((v) => v.id === id) ?? POSTER_VARIANTS[0];
}

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
