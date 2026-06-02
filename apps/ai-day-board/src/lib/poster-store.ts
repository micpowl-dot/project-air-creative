// Per-session poster style overrides, persisted in the browser so a saved
// design survives reloads and is shared between the Studio and the Render queue.

import type { SessionStyle } from "./poster";

export type StyleOverrides = Record<string, Partial<SessionStyle>>;

const KEY = "aiday-poster-styles-v1";

export function loadStyleOverrides(): StyleOverrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as StyleOverrides;
  } catch {
    return {};
  }
}

export function saveStyleOverrides(o: StyleOverrides): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
