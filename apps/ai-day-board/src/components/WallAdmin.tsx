"use client";

import { useEffect, useState } from "react";

interface AdminImage {
  src: string;
  handle: string;
  ts: string;
  hidden: boolean;
  model: "pro" | "flash";
}

export function WallAdmin() {
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/wall-admin", { cache: "no-store" });
      const body = await res.json();
      setImages(Array.isArray(body.images) ? body.images : []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(img: AdminImage) {
    setBusy(img.ts);
    setErr(null);
    const next = !img.hidden;
    // Optimistic update.
    setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, hidden: next } : i)));
    try {
      const res = await fetch("/api/wall-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: img.ts, hidden: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
    } catch (e) {
      // Revert on failure.
      setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, hidden: img.hidden } : i)));
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  const visibleCount = images.filter((i) => !i.hidden).length;
  const hiddenCount = images.length - visibleCount;

  return (
    <main className="min-h-screen bg-[#11100c] text-[#f4f0e6]">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wall Moderation</h1>
            <p className="mt-1 text-sm text-white/50">
              Tap a tile to show or hide it on the live wall. Changes save instantly; the wall updates within a few seconds. Nothing is deleted.
            </p>
          </div>
          <div className="text-right text-sm text-white/60">
            <div>
              <span className="text-[#f4f0e6] font-semibold">{visibleCount}</span> on the wall
            </div>
            <div>
              <span className="text-[#f4f0e6] font-semibold">{hiddenCount}</span> hidden
            </div>
            <button
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="mt-1 rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </header>

        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {loading ? (
          <p className="text-white/40">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-white/40">No images on the wall yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img) => (
              <div key={img.ts || img.src}>
              <button
                onClick={() => toggle(img)}
                disabled={busy === img.ts}
                className={`group relative aspect-square overflow-hidden rounded-lg border text-left transition ${
                  img.hidden ? "border-white/10" : "border-amber-400/60"
                }`}
                title={img.hidden ? "Hidden — tap to show" : "On the wall — tap to hide"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.handle || "wall image"}
                  className={`h-full w-full object-cover transition ${
                    img.hidden ? "opacity-30 grayscale" : "opacity-100"
                  }`}
                />
                {/* Status pill */}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    img.hidden ? "bg-black/70 text-white/70" : "bg-amber-400 text-black"
                  }`}
                >
                  {img.hidden ? "Hidden" : "On wall"}
                </span>
                {busy === img.ts && (
                  <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs">saving…</span>
                )}
                {img.handle && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-xs text-white/90">
                    {img.handle}
                  </span>
                )}
              </button>
              {/* Rendered-by tag: Flash = fallback (Pro was down), stands out. */}
              <div className="mt-1 flex justify-center">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    img.model === "flash" ? "bg-orange-500/20 text-orange-300" : "bg-white/10 text-white/45"
                  }`}
                  title={img.model === "flash" ? "Rendered by the standard model (Pro fallback)" : "Rendered by Pro"}
                >
                  {img.model === "flash" ? "⚡ Flash" : "Pro"}
                </span>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
