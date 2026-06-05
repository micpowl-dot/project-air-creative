// Wall feed storage on Vercel Blob: a public manifest of the generated
// headshots + the last Slack timestamp we processed. Needs a Blob store
// connected to the project (BLOB_READ_WRITE_TOKEN, set automatically on
// Vercel when you add a Blob store). All callers wrap in try/catch so a
// missing store never breaks the wall.

import { put, list } from "@vercel/blob";

export interface WallImage {
  src: string;
  handle?: string;
  ts?: string;
}
export interface WallManifest {
  lastTs: string; // last Slack message ts processed
  images: WallImage[];
}

const MANIFEST_PATH = "wall/manifest.json";

/** Read the manifest, or null if it doesn't exist yet. */
export async function readManifest(): Promise<WallManifest | null> {
  const { blobs } = await list({ prefix: MANIFEST_PATH });
  const b = blobs.find((x) => x.pathname === MANIFEST_PATH);
  if (!b) return null;
  const res = await fetch(b.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as WallManifest;
}

export async function writeManifest(m: WallManifest): Promise<void> {
  await put(MANIFEST_PATH, JSON.stringify(m), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/** Store a finished headshot PNG; returns its public URL. */
export async function putImage(name: string, buf: Buffer): Promise<string> {
  const { url } = await put(`wall/img/${name}.png`, buf, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/png",
  });
  return url;
}
