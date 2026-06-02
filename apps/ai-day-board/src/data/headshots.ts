// Headshot resolution: map a person's name (as it appears in the chart) to an
// image in /public/headshots. The headshot pipeline (Phase 4) downloads every
// photo from the "AI Day Headshots - Export" Drive folder and normalizes it to
// /public/headshots/<slug>.jpg, where <slug> = slugify(chartName).
//
// Reality from the Drive folder: filenames are inconsistent (spelling variants,
// nicknames, first-name-only, mixed formats incl. HEIC, duplicates). So the
// resolver is: OVERRIDES first, then auto-match by slug, then a branded
// initials placeholder. Editors can correct any single match in OVERRIDES
// without touching code elsewhere.

/** chartName -> explicit file basename (no extension) under /public/headshots. */
export const HEADSHOT_OVERRIDES: Record<string, string> = {
  // Spelling mismatch: chart says "Eric Peterson", photo is "Erik Petersen".
  "Eric Peterson": "eric-peterson",
  // Nickname: chart says "Sam Gates", photo is "Samantha Gates".
  "Sam Gates": "sam-gates",
  // First-name-only source files map cleanly to the slug; listed for clarity.
  "Tyler Steben": "tyler-steben",
  "Shannon King": "shannon-king",
  "Miguel Gervassi": "miguel-gervassi",
  // HEIC source ("Thomas_Hinson.HEIC") gets converted to jpg in the pipeline.
  "Thomas Hinson": "thomas-hinson",
};

/**
 * People in the chart with no headshot found in the Drive folder yet.
 * They render as a branded initials placeholder until a photo is added.
 */
export const HEADSHOT_MISSING: string[] = [
  "James Belanger",
  "Michelle Kilroy",
  "Matthew Drooker",
  "Rohit Agarwal",
];

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
 * Resolve a person to a headshot path. Extension is fixed to .jpg because the
 * pipeline normalizes every export to jpg. If a person is in HEADSHOT_MISSING
 * we return src=null so the UI shows the initials placeholder.
 */
export function resolveHeadshot(name: string): HeadshotResolution {
  const initials = initialsOf(name);
  if (HEADSHOT_MISSING.includes(name)) {
    return { name, src: null, initials, missing: true, overridden: false };
  }
  const override = HEADSHOT_OVERRIDES[name];
  const base = override ?? slugify(name);
  return {
    name,
    src: `/headshots/${base}.jpg`,
    initials,
    missing: false,
    overridden: Boolean(override),
  };
}
