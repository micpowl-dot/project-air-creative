// Theming engine for the AI Day board.
//
// Two independent axes you can switch and override per screen:
//   1. ColorScheme  — palette (mirrors the Project AIR Figma palettes)
//   2. Layout       — how the schedule is arranged on screen
//
// Schemes are derived from the established design-system swatch groups
// (POSTER_VARIANTS in poster.ts) so the board matches the Poster Studio:
// primary -> bg, accent -> accent, contrast/light drive text + surfaces.

import type { TrackId } from "./types";
import { POSTER_VARIANTS } from "./poster";

export interface ColorScheme {
  id: string;
  name: string;
  /** true if this scheme reads as dark (affects logo variant choice later). */
  dark: boolean;
  bg: string; // page background
  surface: string; // card background
  surfaceAlt: string; // secondary card / header strip
  ink: string; // primary text ON the page background (light)
  inkSoft: string; // secondary text on the page background
  cardInk: string; // text inside white cards (dark)
  cardInkSoft: string; // secondary text inside white cards
  accent: string; // single accent (stripes, highlights)
  // Per-track accent. Mirrors the three-tier color idea (gold / black / red)
  // from the Figma poster system; tune freely.
  track: Record<TrackId, string>;
}

// Built from the five swatch groups (magenta/cyan/violet/amber/forest).
// primary = page bg; light = text; accent = highlight; surfaces are the
// primary darkened so cards read against the background.
// Vibrant primary page background, WHITE cards with dark navy text for
// readability. Page-level text (hero, time labels) stays light.
export const COLOR_SCHEMES: ColorScheme[] = POSTER_VARIANTS.map((v) => ({
  id: v.id,
  name: v.name,
  dark: true,
  bg: v.bg,
  surface: "#FFFFFF",
  surfaceAlt: "#FFFFFF",
  ink: v.light,
  inkSoft: `color-mix(in srgb, ${v.light} 72%, transparent)`,
  cardInk: "#0D142A",
  cardInkSoft: "color-mix(in srgb, #0D142A 58%, #ffffff)",
  accent: v.accent,
  // Three distinct, non-white track colors so the category bars show on the
  // white cards: accent, the scheme's primary, and the dark contrast.
  track: { explore: v.accent, apply: v.bg, build: v.ink },
}));

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

export const DEFAULT_SCHEME = "magenta";
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
    ["--card-ink" as string]: scheme.cardInk,
    ["--card-ink-soft" as string]: scheme.cardInkSoft,
    ["--accent" as string]: scheme.accent,
    ["--track-explore" as string]: scheme.track.explore,
    ["--track-apply" as string]: scheme.track.apply,
    ["--track-build" as string]: scheme.track.build,
  } as React.CSSProperties;
}
