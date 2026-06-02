// Headshot resolution: map a person's name (as it appears in the chart) to an
// image in /public/headshots. Source art is the branded illustrated headshots
// from "Project Air elements/Headshots", copied to /public/headshots/<slug>.png
// where <slug> = slugify(personName).
//
// A few chart names don't slugify to the art filename (spelling variants,
// nicknames), so the resolver is: OVERRIDES first, then auto-match by slug,
// then a branded initials placeholder for anyone without art. Editors can
// correct any single match in OVERRIDES without touching code elsewhere.

/** chartName -> explicit file basename (no extension) under /public/headshots.
 * Only needed where the chart name doesn't slugify to the headshot filename
 * (from the Project Air elements/Headshots set). */
export const HEADSHOT_OVERRIDES: Record<string, string> = {
  // Nickname: chart says "Sam Gates" (10:00 session), art is "Samantha Gates".
  "Sam Gates": "samantha-gates",
  // Spelling mismatch: chart says "Michelle Kilroy", art is "Michelle Killroy".
  "Michelle Kilroy": "michelle-killroy",
};

/**
 * People in the chart with no headshot in the Headshots set yet.
 * They render as a branded initials placeholder until art is added.
 */
export const HEADSHOT_MISSING: string[] = [];

/** Lowercase, strip accents/punctuation, collapse to a hyphen slug. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop diacritics
    .toLowerCase()
    .replace(/['’.]/g, "") // O'Neil -> oneil, de Sa stays
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface HeadshotResolution {
  name: string;
  src: string | null; // public path, or null when missing
  initials: string; // fallback label
  missing: boolean;
  overridden: boolean;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Resolve a person to a headshot path. Extension is fixed to .png (the art set
 * is PNG). If a person is in HEADSHOT_MISSING we return src=null so the UI
 * shows the initials placeholder.
 */
export function resolveHeadshot(name: string, alt = false): HeadshotResolution {
  const initials = initialsOf(name);
  if (HEADSHOT_MISSING.includes(name)) {
    return { name, src: null, initials, missing: true, overridden: false };
  }
  const override = HEADSHOT_OVERRIDES[name];
  const base = override ?? slugify(name);
  // Alternate art lives in /public/headshots/alternates/<slug>.png
  const dir = alt ? "/headshots/alternates/" : "/headshots/";
  return {
    name,
    src: `${dir}${base}.png`,
    initials,
    missing: false,
    overridden: Boolean(override),
  };
}
