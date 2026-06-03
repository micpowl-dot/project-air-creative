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

import type { Schedule, ScheduleSlot, Session, TrackId } from "./types";

export type SiteId = "brookhaven" | "andover" | "newYork";

/** Poster aspect: 16:9 TV (wide) or 1:1 square. */
export type PosterFormat = "wide" | "square";
export const POSTER_DIMS: Record<PosterFormat, { w: number; h: number }> = {
  wide: { w: 1920, h: 1080 },
  square: { w: 1080, h: 1080 },
};

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

// Two-layer headshot: a transparent cutout over a selectable patterned
// background (files in /public/headshots/bg/<id>.png). `swatch` is the small
// color chip shown in the picker.
export const HEADSHOT_BACKGROUNDS: { id: string; label: string; swatch: string }[] = [
  { id: "magenta", label: "Magenta", swatch: "#FB00FF" },
  { id: "magenta-accent", label: "Magenta accent", swatch: "#FFE500" },
  { id: "cyan", label: "Cyan", swatch: "#0062FF" },
  { id: "cyan-accent", label: "Cyan accent", swatch: "#67FAE0" },
  { id: "violet", label: "Violet", swatch: "#46125B" },
  { id: "violet-accent", label: "Violet accent", swatch: "#FFDC14" },
  { id: "amber", label: "Amber", swatch: "#FF9500" },
  { id: "amber-accent", label: "Amber accent", swatch: "#6B0800" },
  { id: "forest", label: "Forest", swatch: "#1F7A4D" },
  { id: "forest-accent", label: "Forest accent", swatch: "#76D662" },
];

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
  name: string; // primary speaker (single-headshot fallback)
  names: string[]; // all instructors (multi-portrait)
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
    names: session.instructors,
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

// --- Profile mode (per-participant, not per-session) -----------------------
export const DEFAULT_PROFILE_TAG = "AI Ambassador";

export interface ParticipantEntry {
  id: string;
  name: string;
}

function pslug(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every unique person across the schedule (session instructors + opening/
 *  closing remarks), de-duplicated, in first-seen order. */
export function participantsFromSchedule(schedule: Schedule): ParticipantEntry[] {
  const seen = new Set<string>();
  const out: ParticipantEntry[] = [];
  for (const slot of schedule.slots) {
    const people =
      slot.kind === "sessions"
        ? (slot.sessions ?? []).flatMap((s) => s.instructors)
        : slot.people ?? [];
    for (const name of people) {
      const id = pslug(name);
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push({ id, name });
      }
    }
  }
  // Names prioritized: order the roster alphabetically, not by session sequence.
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Poster data for an individual: name + a free-text tag (e.g. "AI Ambassador").
 *  No session/room/time — it's about the person. */
export function profileToPoster(
  name: string,
  tag: string,
  overrides: Partial<PosterData> = {}
): PosterData {
  return {
    dateLabel: DATE_LABEL,
    eventTitle: "AI DAY",
    name,
    names: [name],
    sessionTitle: "",
    tag,
    location: "",
    room: "",
    time: "",
    ...overrides,
  };
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

// --- Track-driven defaults -------------------------------------------------
// Color coordination is established by the Track tag first: each track maps to
// a consistent scheme by default (overridable per session). Ring shape and
// top-edge graphic also default per track for visual rhythm.
export const TRACK_SCHEME: Record<TrackId, string> = {
  explore: "magenta",
  apply: "cyan",
  build: "amber",
};
const TRACK_RING: Record<TrackId, RingStyle> = {
  explore: "clover",
  apply: "circle",
  build: "star",
};
const TRACK_TOP: Record<TrackId, TopStyle> = {
  explore: "piano-stripes",
  apply: "converging",
  build: "checker",
};

// Size sliders (multipliers on the base element size).
export const RING_SIZE = { min: 0.6, max: 1.6, default: 1 };
export const TOP_SIZE = { min: 0.6, max: 1.8, default: 1 };
export const PORTRAIT_SIZE = { min: 0.6, max: 1.6, default: 1 };
export const SQUIGGLE_SIZE = { min: 0.4, max: 2, default: 1 };
export const TEXT_SIZE = { min: 0.5, max: 2, default: 1 };

// Position offsets, expressed in 1920x1080 design pixels (added via transform).
export const OFFSET_X = { min: -800, max: 800, default: 0, step: 10 };
export const OFFSET_Y = { min: -500, max: 500, default: 0, step: 10 };

/** The full set of design choices for one session's poster. */
export interface SessionStyle {
  variantId: string;
  ringStyle: RingStyle;
  topStyle: TopStyle;
  ringSize: number;
  topSize: number;
  topOpacity: number; // top-edge graphic opacity (0–1)
  topFlip: boolean; // mirror the top-edge graphic horizontally
  portraitSize: number;
  useAltHeadshot: boolean; // use the alternate headshot art
  headshotBg: string; // background id behind the transparent cutout (poster)
  badgeOffsetX: number; // moves ring badge + headshot together (design px)
  dateSize: number; // date text scale
  tagSize: number; // track-tag text scale
  // decorative element positions (design px)
  topOffsetX: number;
  topOffsetY: number;
  bottomOffsetX: number;
  bottomOffsetY: number;
  squiggleSize: number;
  squiggleOffsetX: number;
  squiggleOffsetY: number;
  site: SiteId;
  slots: PosterSlots;
  tagText?: string; // profile mode: free-text role under the name (e.g. "AI Ambassador")
  layout?: ProfileLayout; // profile mode: per-component x/y/scale/opacity
}

// --- Per-component transform model (Profile Studio 1:1) --------------------
// Every element on the 1:1 can be moved (x/y, in design px), scaled, and faded.
export interface CompTransform {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}
export const COMP_DEFAULT: CompTransform = { x: 0, y: 0, scale: 1, opacity: 1 };

export type ProfileComp = "aiday" | "speaker" | "date" | "badge" | "top" | "squiggle" | "air";
export type ProfileLayout = Partial<Record<ProfileComp, Partial<CompTransform>>>;

/** Components in control-panel order. "badge" = headshot + ring as one unit. */
export const PROFILE_COMPS: { id: ProfileComp; label: string }[] = [
  { id: "badge", label: "Headshot + ring" },
  { id: "speaker", label: "Name + text" },
  { id: "aiday", label: "AI DAY logo" },
  { id: "date", label: "Date" },
  { id: "top", label: "Top graphic" },
  { id: "squiggle", label: "Squiggle" },
  { id: "air", label: "AIR logo" },
];

export const PROFILE_POS = { min: -700, max: 700 };
export const PROFILE_SCALE = { min: 0.2, max: 3 };

/** Resolve a component's transform, falling back to the neutral default. */
export function compTransform(layout: ProfileLayout | undefined, comp: ProfileComp): CompTransform {
  return { ...COMP_DEFAULT, ...(layout?.[comp] ?? {}) };
}

// FACTORY DEFAULTS — the sizing/positioning a brand-new user (empty browser)
// starts with. Edit these to set the preferred starting point for everyone.
// (Use the Studio's "Copy starting defaults" button to capture a tuned poster's
// values as JSON, then paste them here.)
export const FACTORY_DEFAULTS = {
  ringSize: 1,
  topSize: 1.45,
  topOpacity: 1,
  topFlip: true,
  portraitSize: 1,
  useAltHeadshot: false,
  badgeOffsetX: 0,
  dateSize: 1.25,
  tagSize: 1.75,
  topOffsetX: 780,
  topOffsetY: -170,
  bottomOffsetX: -230,
  bottomOffsetY: 80,
  squiggleSize: 1.45,
  squiggleOffsetX: -40,
  squiggleOffsetY: -70,
};

/** The factory-default fields, in the order the "Copy" button emits them. */
export type FactoryDefaults = typeof FACTORY_DEFAULTS;

/** Default style for a session: track-derived look + factory sizing. */
export function defaultSessionStyle(track: TrackId): SessionStyle {
  return {
    variantId: TRACK_SCHEME[track],
    ringStyle: TRACK_RING[track],
    topStyle: TRACK_TOP[track],
    site: "brookhaven",
    slots: { ...DEFAULT_SLOTS },
    headshotBg: `${TRACK_SCHEME[track]}-accent`, // accent-version bg, matches the name color
    ...FACTORY_DEFAULTS,
  };
}

/** Default style for a 1:1 profile. The square layout hand-places each element,
 *  so decorative offsets START at zero (the wide poster's offsets don't apply
 *  to the square). The X/Y sliders then move things from their placed spot. */
export function defaultProfileStyle(): SessionStyle {
  return {
    ...defaultSessionStyle("explore"),
    topOffsetX: 0,
    topOffsetY: 0,
    bottomOffsetX: 0,
    bottomOffsetY: 0,
    squiggleOffsetX: 0,
    squiggleOffsetY: 0,
    badgeOffsetX: 0,
  };
}

export type { ScheduleSlot };
