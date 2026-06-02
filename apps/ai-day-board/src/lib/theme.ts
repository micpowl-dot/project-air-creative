// Theming engine for the AI Day board.
//
// Two independent axes you can switch and override per screen:
//   1. ColorScheme  — palette (mirrors the Project AIR Figma palettes)
//   2. Layout       — how the schedule is arranged on screen
//
// Color values: the "cream" and "near-black" schemes use the LOCKED base
// palette from docs/brand-guidelines.md. The "festival-*" schemes are the
// in-development expansion direction (Coachella/SXSW energy: magenta, cyan,
// purple, hot amber). Swap exact hexes once the Figma expansion is locked.

import type { TrackId } from "./types";

export interface ColorScheme {
  id: string;
  name: string;
  /** true if this scheme reads as dark (affects logo variant choice later). */
  dark: boolean;
  bg: string; // page background
  surface: string; // card background
  surfaceAlt: string; // secondary card / header strip
  ink: string; // primary text
  inkSoft: string; // secondary text
  accent: string; // single accent (stripes, highlights)
  // Per-track accent. Mirrors the three-tier color idea (gold / black / red)
  // from the Figma poster system; tune freely.
  track: Record<TrackId, string>;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "cream",
    name: "Cream (base)",
    dark: false,
    bg: "#EDEBE4",
    surface: "#F5F3EE",
    surfaceAlt: "#E2DFD5",
    ink: "#111111",
    inkSoft: "#6B6B6B",
    accent: "#C8910A",
    track: { explore: "#C8910A", apply: "#111111", build: "#B5341F" },
  },
  {
    id: "near-black",
    name: "Near-Black (base)",
    dark: true,
    bg: "#111111",
    surface: "#1C1C1C",
    surfaceAlt: "#262626",
    ink: "#F5F3EE",
    inkSoft: "#9A9A9A",
    accent: "#C8910A",
    track: { explore: "#E6A91E", apply: "#F5F3EE", build: "#E0573F" },
  },
  {
    id: "festival-magenta",
    name: "Festival — Magenta",
    dark: true,
    bg: "#1F0A2E",
    surface: "#2E1145",
    surfaceAlt: "#3D1A5B",
    ink: "#F7ECFF",
    inkSoft: "#C4A6DD",
    accent: "#E6007E",
    track: { explore: "#FFB200", apply: "#16D5E6", build: "#E6007E" },
  },
  {
    id: "festival-cyan",
    name: "Festival — Electric Cyan",
    dark: true,
    bg: "#06141B",
    surface: "#0C2230",
    surfaceAlt: "#123040",
    ink: "#EAFBFF",
    inkSoft: "#86B8C7",
    accent: "#14C8E6",
    track: { explore: "#FFC23D", apply: "#14C8E6", build: "#FF5DA2" },
  },
];

export interface Layout {
  id: string;
  name: string;
  description: string;
}

export const LAYOUTS: Layout[] = [
  {
    id: "grid",
    name: "Track Grid",
    description: "Three track columns by time. Mirrors the chart on The Drop.",
  },
  {
    id: "agenda",
    name: "Agenda",
    description: "Single vertical timeline. Best for narrow screens and phones.",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "One time slot at a time, oversized. Built for rotating signage.",
  },
];

export const DEFAULT_SCHEME = "cream";
export const DEFAULT_LAYOUT = "grid";

export function getScheme(id: string): ColorScheme {
  return COLOR_SCHEMES.find((s) => s.id === id) ?? COLOR_SCHEMES[0];
}

export function getLayout(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** Turn a scheme into CSS custom properties for the board root. */
export function schemeVars(scheme: ColorScheme): React.CSSProperties {
  return {
    ["--bg" as string]: scheme.bg,
    ["--surface" as string]: scheme.surface,
    ["--surface-alt" as string]: scheme.surfaceAlt,
    ["--ink" as string]: scheme.ink,
    ["--ink-soft" as string]: scheme.inkSoft,
    ["--accent" as string]: scheme.accent,
    ["--track-explore" as string]: scheme.track.explore,
    ["--track-apply" as string]: scheme.track.apply,
    ["--track-build" as string]: scheme.track.build,
  } as React.CSSProperties;
}
