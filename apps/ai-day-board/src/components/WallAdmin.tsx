"use client";

import { useEffect, useState } from "react";

interface AdminImage {
  src: string;
  handle: string;
  ts: string;
  hidden: boolean;
  flip: boolean;
  model: "pro" | "flash";
}

interface Rendered { pro: number; flash: number }
interface Budget { budgetUsd: number; spent: number; remaining: number }

export function WallAdmin() {
  const [images, setImages] = useState<AdminImage[]>([]);
  const [rendered, setRendered] = useState<Rendered>({ pro: 0, flash: 0 });
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "lastname">("recent");
  const [showSrc, setShowSrc] = useState<Set<string>>(new Set()); // ts showing the original selfie

  function toggleSrc(ts: string, e: React.MouseEvent) {
    e.stopPropagation();
    setShowSrc((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts); else next.add(ts);
      return next;
    });
  }

  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // ts marked for batch re-render

  function toggleSelect(ts: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => { const n = new Set(prev); if (n.has(ts)) n.delete(ts); else n.add(ts); return n; });
  }

  async function load() {
    try {
      const res = await fetch("/api/wall-admin", { cache: "no-store" });
      const body = await res.json();
      setImages(Array.isArray(body.images) ? body.images : []);
      if (body.rendered) setRendered(body.rendered);
      setBudget(body.budget ?? null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  // Re-render only the SELECTED portraits with the current (fixed) prompt — so
  // you redo just the bad/Max ones, not the whole gallery. Runs one at a time
  // from the browser so each call stays under the function timeout.
  async function rerenderSelected() {
    const targets = images.filter((i) => selected.has(i.ts));
    if (!targets.length) { setErr("Select the portraits to redo first — tap 'Select' on each bad one."); return; }
    if (!window.confirm(`Re-render the ${targets.length} selected portrait(s) with the fixed prompt?\n\nRuns one at a time (~20s each). You can keep moderating while it runs; leave this tab open.`)) return;
    setErr(null);
    setBatch({ done: 0, total: targets.length });
    for (let k = 0; k < targets.length; k++) {
      const img = targets[k];
      try {
        const res = await fetch("/api/wall-admin/rerender", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ts: img.ts }),
        });
        const body = await res.json();
        if (res.ok) {
          setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, src: `${body.src}?t=${Date.now()}`, model: body.model, flip: false } : i)));
        }
      } catch {
        /* skip this one, keep going */
      }
      setBatch({ done: k + 1, total: targets.length });
    }
    setBatch(null);
    setSelected(new Set());
    load();
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

  // Re-render this portrait from its original selfie using the current prompt
  // (Pro if available, else Flash). Replaces the image in place. Costs 1 render.
  async function rerender(img: AdminImage, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Re-render ${img.handle || "this portrait"} with the latest prompt?\n\nUses one render (Pro if available, otherwise Flash) and replaces the current image. Takes up to ~30s.`)) return;
    setBusy(img.ts);
    setErr(null);
    try {
      const res = await fetch("/api/wall-admin/rerender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: img.ts }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      // Swap in the new render (cache-bust the img so the new file loads).
      setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, src: `${body.src}?t=${Date.now()}`, model: body.model, hidden: false, flip: false } : i)));
      setShowSrc((prev) => { const n = new Set(prev); n.delete(img.ts); return n; });
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  // Mirror (horizontal flip) the portrait on the wall. Reversible.
  async function flip(img: AdminImage, e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger the tile's show/hide toggle
    setBusy(img.ts);
    setErr(null);
    const next = !img.flip;
    // Optimistic update.
    setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, flip: next } : i)));
    try {
      const res = await fetch("/api/wall-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: img.ts, flip: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
    } catch (e) {
      // Revert on failure.
      setImages((prev) => prev.map((i) => (i.ts === img.ts ? { ...i, flip: img.flip } : i)));
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  // Remove from the gallery (drops the manifest entry; the image file stays in
  // the repo as an orphan and can be re-added). Confirms first.
  async function remove(img: AdminImage, e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger the tile's show/hide toggle
    if (!window.confirm(`Remove ${img.handle || "this portrait"} from the gallery?\n\nIt comes off the wall and out of this list. The image file is kept (orphaned) and can be re-added later.`)) return;
    setBusy(img.ts);
    setErr(null);
    const prev = images;
    setImages((p) => p.filter((i) => i.ts !== img.ts)); // optimistic
    try {
      const res = await fetch("/api/wall-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: img.ts, remove: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
    } catch (err) {
      setImages(prev); // revert
      setErr(String(err));
    } finally {
      setBusy(null);
    }
  }

  const visibleCount = images.filter((i) => !i.hidden).length;
  const hiddenCount = images.length - visibleCount;

  // Last name parsed from the handle ("@first.last" -> "last"); blank handles
  // (anonymous, the dog) sort to the end.
  const lastName = (h: string) => {
    const clean = (h || "").replace(/^@/, "").trim();
    if (!clean) return "￿"; // push captionless tiles last
    const parts = clean.split(".");
    return (parts[parts.length - 1] || clean).toLowerCase();
  };
  const sorted = [...images].sort((a, b) =>
    sort === "lastname"
      ? lastName(a.handle).localeCompare(lastName(b.handle)) || Number(b.ts) - Number(a.ts)
      : Number(b.ts) - Number(a.ts)
  );

  return (
    <main className="min-h-screen bg-[#11100c] text-[#f4f0e6]">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wall Moderation</h1>
            <p className="mt-1 text-sm text-white/50">
              Tap a tile to show or hide it on the live wall. Use ⇄ Mirror to flip a portrait horizontally. Changes save instantly; the wall updates within a few seconds. Nothing is deleted.
            </p>
          </div>
          <div className="text-right text-sm text-white/60">
            <div>
              <span className="text-[#f4f0e6] font-semibold">{visibleCount}</span> on the wall
            </div>
            <div>
              <span className="text-[#f4f0e6] font-semibold">{hiddenCount}</span> hidden
            </div>
            <div className="mt-1 border-t border-white/10 pt-1">
              <span className="text-[#f4f0e6] font-semibold">{rendered.pro + rendered.flash}</span> rendered
              <span className="text-white/40"> ({rendered.pro} Pro · {rendered.flash} Flash)</span>
            </div>
            {budget && (
              <div className={budget.remaining <= budget.budgetUsd * 0.2 ? "text-orange-300" : "text-white/60"}>
                ~<span className="font-semibold">${budget.remaining.toFixed(2)}</span> left of ${budget.budgetUsd.toFixed(0)}
                <span className="text-white/40"> (est.)</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-end gap-2">
              <button
                onClick={rerenderSelected}
                disabled={batch !== null || selected.size === 0}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                title="Re-render only the selected portraits with the fixed prompt"
              >
                {batch ? `Re-rendering ${batch.done}/${batch.total}…` : `↻ Re-render selected${selected.size ? ` (${selected.size})` : ""}`}
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Sort toggle */}
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="text-white/40">Sort:</span>
          {([["recent", "Most recent"], ["lastname", "Last name (A–Z)"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-md px-2.5 py-1 font-semibold ${
                sort === key ? "bg-amber-400 text-black" : "border border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-white/40">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-white/40">No images on the wall yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sorted.map((img) => (
              <div key={img.ts || img.src} className={`relative rounded-lg ${selected.has(img.ts) ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#11100c]" : ""}`}>
              {/* Remove-from-gallery (moves to orphaned; file kept) */}
              <button
                onClick={(e) => remove(img, e)}
                disabled={busy === img.ts}
                title="Remove from gallery (keeps the file, can be re-added)"
                className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-sm text-white/80 hover:bg-red-600 hover:text-white"
              >
                ✕
              </button>
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
                  src={showSrc.has(img.ts) ? `/api/wall-admin/source?ts=${encodeURIComponent(img.ts)}` : img.src}
                  alt={img.handle || "wall image"}
                  className={`h-full w-full object-cover transition ${
                    img.hidden ? "opacity-30 grayscale" : "opacity-100"
                  }`}
                  style={!showSrc.has(img.ts) && img.flip ? { transform: "scaleX(-1)" } : undefined}
                  onError={(e) => { if (showSrc.has(img.ts)) (e.currentTarget as HTMLImageElement).src = img.src; }}
                />
                {/* Status pill */}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    img.hidden ? "bg-black/70 text-white/70" : "bg-amber-400 text-black"
                  }`}
                >
                  {img.hidden ? "Hidden" : "On wall"}
                </span>
                {/* Showing the original selfie (QA) */}
                {showSrc.has(img.ts) && (
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    SOURCE
                  </span>
                )}
                {busy === img.ts && (
                  <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs">saving…</span>
                )}
                {img.handle && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-xs text-white/90">
                    {img.handle}
                  </span>
                )}
              </button>
              {/* Select (batch) + Source/Render + Re-render + Mirror + rendered-by tag. */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <button
                  onClick={(e) => toggleSelect(img.ts, e)}
                  title="Select for batch re-render"
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                    selected.has(img.ts) ? "bg-emerald-500 text-white" : "bg-white/10 text-white/55 hover:bg-white/20"
                  }`}
                >
                  {selected.has(img.ts) ? "✓ Selected" : "Select"}
                </button>
                <button
                  onClick={(e) => toggleSrc(img.ts, e)}
                  title="Show the original selfie to QA the render"
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                    showSrc.has(img.ts) ? "bg-sky-500 text-white" : "bg-white/10 text-white/55 hover:bg-white/20"
                  }`}
                >
                  {showSrc.has(img.ts) ? "Render" : "Source"}
                </button>
                <button
                  onClick={(e) => rerender(img, e)}
                  disabled={busy === img.ts}
                  title="Re-render from the original selfie with the latest prompt"
                  className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55 transition hover:bg-emerald-500 hover:text-white disabled:opacity-40"
                >
                  ↻ Re-render
                </button>
                <button
                  onClick={(e) => flip(img, e)}
                  disabled={busy === img.ts}
                  title="Mirror (horizontal flip) on the wall"
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                    img.flip ? "bg-amber-400 text-black" : "bg-white/10 text-white/55 hover:bg-white/20"
                  }`}
                >
                  ⇄ Mirror
                </button>
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
