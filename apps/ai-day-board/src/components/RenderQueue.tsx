"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { Schedule } from "@/lib/types";
import {
  getVariant,
  posterEntriesFromSchedule,
  sessionToPoster,
  defaultSessionStyle,
  type SessionStyle,
  type PosterEntry,
} from "@/lib/poster";
import { Poster } from "./Poster";
import { loadStyleOverrides, type StyleOverrides } from "@/lib/poster-store";

const OUT_W = 1920;
const OUT_H = 1080;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fileName(entry: PosterEntry, style: SessionStyle, location: string) {
  return `aiday_${slugify(entry.session.title)}_${slugify(location)}_${style.variantId}.png`;
}

async function exportNode(node: HTMLElement, name: string) {
  const url = await toPng(node, { width: OUT_W, height: OUT_H, pixelRatio: 1, cacheBust: true });
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // give the browser a beat between downloads
  await new Promise((r) => setTimeout(r, 350));
}

function RenderCard({
  entry,
  style,
  focused,
  checked,
  onToggle,
}: {
  entry: PosterEntry;
  style: SessionStyle;
  focused: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const variant = getVariant(style.variantId);
  const data = sessionToPoster(entry.session, style.site, entry.time);
  const previewW = 540;

  async function download() {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      await exportNode(nodeRef.current, fileName(entry, style, data.location));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id={`card-${entry.id}`}
      className="rounded-lg p-3"
      style={{ background: focused || checked ? "rgba(255,255,255,0.08)" : "transparent", outline: focused ? `2px solid ${variant.accent}` : "none" }}
    >
      <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-white/70">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        Include in batch
      </label>
      <div style={{ width: previewW, height: (previewW * OUT_H) / OUT_W, overflow: "hidden" }}>
        <div style={{ width: OUT_W, height: OUT_H, transform: `scale(${previewW / OUT_W})`, transformOrigin: "top left" }}>
          <div ref={nodeRef} id={`rnode-${entry.id}`} style={{ width: OUT_W, height: OUT_H }}>
            <Poster
              data={data}
              variant={variant}
              slots={style.slots}
              ringStyle={style.ringStyle}
              topStyle={style.topStyle}
              ringSize={style.ringSize}
              topSize={style.topSize}
              topFlip={style.topFlip}
              portraitSize={style.portraitSize}
              useAltHeadshot={style.useAltHeadshot}
              topOffsetX={style.topOffsetX}
              topOffsetY={style.topOffsetY}
              bottomOffsetX={style.bottomOffsetX}
              bottomOffsetY={style.bottomOffsetY}
              squiggleSize={style.squiggleSize}
              squiggleOffsetX={style.squiggleOffsetX}
              squiggleOffsetY={style.squiggleOffsetY}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between" style={{ width: previewW }}>
        <div className="text-xs text-white/60">
          <div className="font-semibold text-white/85">{entry.session.title}</div>
          <div>{entry.time} · {data.location} · {style.variantId}</div>
        </div>
        <button onClick={download} disabled={busy} className="rounded-md px-3 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-50" style={{ background: variant.accent }}>
          {busy ? "Rendering…" : "Download 1920×1080"}
        </button>
      </div>
    </div>
  );
}

export function RenderQueue({ schedule, focus }: { schedule: Schedule; focus?: string }) {
  const entries = useMemo(() => posterEntriesFromSchedule(schedule), [schedule]);
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<{ running: boolean; done: number; total: number } | null>(null);

  useEffect(() => {
    setOverrides(loadStyleOverrides());
    setSelected(new Set(entries.map((e) => e.id))); // default: all selected
    setReady(true);
  }, [entries]);

  useEffect(() => {
    if (ready && focus) document.getElementById(`card-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ready, focus]);

  const styleFor = (e: PosterEntry): SessionStyle => ({ ...defaultSessionStyle(e.session.track), ...overrides[e.id] });
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = () => setSelected(new Set(entries.map((e) => e.id)));
  const deselectAll = () => setSelected(new Set());

  async function renderSelected() {
    const chosen = entries.filter((e) => selected.has(e.id));
    setBatch({ running: true, done: 0, total: chosen.length });
    for (let i = 0; i < chosen.length; i++) {
      const e = chosen[i];
      const node = document.getElementById(`rnode-${e.id}`);
      if (node) {
        const st = styleFor(e);
        const data = sessionToPoster(e.session, st.site, e.time);
        await exportNode(node, fileName(e, st, data.location));
      }
      setBatch({ running: true, done: i + 1, total: chosen.length });
    }
    setBatch({ running: false, done: chosen.length, total: chosen.length });
    setTimeout(() => setBatch(null), 4000);
  }

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-[#f5f3ee]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Render Queue</h1>
            <p className="text-sm text-white/60">{entries.length} posters · select any, then batch-render to 1920×1080 PNG</p>
          </div>
          <Link href="/posters" className="text-sm underline hover:text-white">← Back to Studio</Link>
        </header>

        {/* Batch toolbar */}
        <div className="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#1b1b1b]/90 px-4 py-3 backdrop-blur">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <button onClick={selectAll} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Select all</button>
          <button onClick={deselectAll} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Deselect all</button>
          <button
            onClick={renderSelected}
            disabled={selected.size === 0 || batch?.running}
            className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-40"
          >
            {batch?.running ? `Rendering ${batch.done}/${batch.total}…` : `Render selected (${selected.size})`}
          </button>
          {batch && !batch.running && <span className="text-xs text-emerald-400">✓ Rendered {batch.total} posters</span>}
          <span className="text-[11px] text-white/40">Tip: your browser may ask to allow multiple downloads.</span>
        </div>

        {!ready ? (
          <p className="text-white/50">Loading saved styles…</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {entries.map((e) => (
              <RenderCard
                key={e.id}
                entry={e}
                style={styleFor(e)}
                focused={e.id === focus}
                checked={selected.has(e.id)}
                onToggle={() => toggle(e.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
