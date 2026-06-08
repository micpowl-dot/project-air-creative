"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { Schedule } from "@/lib/types";
import {
  getVariant,
  posterEntriesFromSchedule,
  participantsFromSchedule,
  sessionToPoster,
  profileToPoster,
  defaultSessionStyle,
  defaultProfileStyle,
  DEFAULT_PROFILE_TAG,
  POSTER_DIMS,
  type SessionStyle,
  type PosterData,
  type PosterSlots,
  type PosterFormat,
} from "@/lib/poster";
import { Poster } from "./Poster";
import { resolveTitle } from "@/data/titles";
import { loadStyleOverrides, type StyleOverrides } from "@/lib/poster-store";

type RenderMode = "sessions" | "profiles";

// One thing to render: a poster's data + its style + a filename base + label.
interface RenderItem {
  id: string;
  data: PosterData;
  style: SessionStyle;
  slots: PosterSlots;
  label: string;
  sub: string;
  fileBase: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function exportNode(node: HTMLElement, name: string, w: number, h: number) {
  const url = await toPng(node, { width: w, height: h, pixelRatio: 1, cacheBust: true });
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // give the browser a beat between downloads
  await new Promise((r) => setTimeout(r, 350));
}

function RenderCard({
  item,
  format,
  focused,
  checked,
  onToggle,
}: {
  item: RenderItem;
  format: PosterFormat;
  focused: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const variant = getVariant(item.style.variantId);
  const { w: OUT_W, h: OUT_H } = POSTER_DIMS[format];
  const previewW = 540;
  const ratio = format === "square" ? "1x1" : "16x9";
  const fileName = `${item.fileBase}_${item.style.variantId}_${ratio}.png`;

  async function download() {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      await exportNode(nodeRef.current, fileName, OUT_W, OUT_H);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id={`card-${item.id}`}
      className="rounded-lg p-3"
      style={{ background: focused || checked ? "rgba(255,255,255,0.08)" : "transparent", outline: focused ? `2px solid ${variant.accent}` : "none" }}
    >
      <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-white/70">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        Include in batch
      </label>
      <div style={{ width: previewW, height: (previewW * OUT_H) / OUT_W, overflow: "hidden" }}>
        <div style={{ width: OUT_W, height: OUT_H, transform: `scale(${previewW / OUT_W})`, transformOrigin: "top left" }}>
          <div ref={nodeRef} id={`rnode-${item.id}`} style={{ width: OUT_W, height: OUT_H }}>
            <Poster
              data={item.data}
              variant={variant}
              format={format}
              slots={item.slots}
              ringStyle={item.style.ringStyle}
              topStyle={item.style.topStyle}
              ringSize={item.style.ringSize}
              topSize={item.style.topSize}
              topOpacity={item.style.topOpacity}
              topFlip={item.style.topFlip}
              portraitSize={item.style.portraitSize}
              nameScale={item.style.nameScale}
              roleScale={item.style.roleScale}
              headshotBg={item.style.headshotBg}
              useAltHeadshot={item.style.useAltHeadshot}
              badgeOffsetX={item.style.badgeOffsetX}
              dateSize={item.style.dateSize}
              tagSize={item.style.tagSize}
              topOffsetX={item.style.topOffsetX}
              topOffsetY={item.style.topOffsetY}
              bottomOffsetX={item.style.bottomOffsetX}
              bottomOffsetY={item.style.bottomOffsetY}
              squiggleSize={item.style.squiggleSize}
              squiggleOpacity={item.style.squiggleOpacity}
              squiggleOffsetX={item.style.squiggleOffsetX}
              squiggleOffsetY={item.style.squiggleOffsetY}
              layout={item.style.layout}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between" style={{ width: previewW }}>
        <div className="text-xs text-white/60">
          <div className="font-semibold text-white/85">{item.label}</div>
          <div>{item.sub} · {item.style.variantId}</div>
        </div>
        <button onClick={download} disabled={busy} className="rounded-md px-3 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-50" style={{ background: variant.accent }}>
          {busy ? "Rendering…" : `Download ${OUT_W}×${OUT_H}`}
        </button>
      </div>
    </div>
  );
}

export function RenderQueue({
  schedule,
  focus,
  mode = "sessions",
}: {
  schedule: Schedule;
  focus?: string;
  mode?: RenderMode;
}) {
  const isProfile = mode === "profiles";
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<{ running: boolean; done: number; total: number } | null>(null);
  const [format, setFormat] = useState<PosterFormat>(isProfile ? "square" : "wide");

  // Build the render items for the active mode (depends on saved overrides).
  const items: RenderItem[] = useMemo(() => {
    if (isProfile) {
      return participantsFromSchedule(schedule).map((p) => {
        const style: SessionStyle = { ...defaultProfileStyle(), ...overrides[p.id] };
        const tagText = (style.tagText ?? DEFAULT_PROFILE_TAG).trim() || DEFAULT_PROFILE_TAG;
        const roleText = style.roleText ?? resolveTitle(p.name);
        return {
          id: p.id,
          data: profileToPoster(p.name, tagText, roleText),
          style,
          slots: { ...style.slots, sessionTitle: false, location: false, room: false, time: false },
          label: p.name,
          sub: tagText,
          fileBase: `aiday_profile_${slugify(p.name)}`,
        };
      });
    }
    return posterEntriesFromSchedule(schedule).map((e) => {
      const style: SessionStyle = { ...defaultSessionStyle(e.session.track), ...overrides[e.id] };
      const data = sessionToPoster(e.session, style.site, e.time);
      return {
        id: e.id,
        data,
        style,
        slots: style.slots,
        label: e.session.title,
        sub: `${e.time} · ${data.location}`,
        fileBase: `aiday_${slugify(e.session.title)}_${slugify(data.location)}`,
      };
    });
  }, [schedule, isProfile, overrides]);

  useEffect(() => {
    setOverrides(loadStyleOverrides());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) setSelected(new Set(items.map((i) => i.id))); // default: all selected
  }, [ready, items]);

  useEffect(() => {
    if (ready && focus) document.getElementById(`card-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ready, focus]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = () => setSelected(new Set(items.map((i) => i.id)));
  const deselectAll = () => setSelected(new Set());

  async function renderSelected() {
    const chosen = items.filter((i) => selected.has(i.id));
    setBatch({ running: true, done: 0, total: chosen.length });
    const ratio = format === "square" ? "1x1" : "16x9";
    for (let i = 0; i < chosen.length; i++) {
      const item = chosen[i];
      const node = document.getElementById(`rnode-${item.id}`);
      if (node) {
        const { w, h } = POSTER_DIMS[format];
        await exportNode(node, `${item.fileBase}_${item.style.variantId}_${ratio}.png`, w, h);
      }
      setBatch({ running: true, done: i + 1, total: chosen.length });
    }
    setBatch({ running: false, done: chosen.length, total: chosen.length });
    setTimeout(() => setBatch(null), 4000);
  }

  const backHref = isProfile ? "/profile" : "/posters";

  return (
    <div className="min-h-screen bg-[#0D142A] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              {isProfile ? "Profile Render Queue" : "Render Queue"}
            </h1>
            <p className="text-sm text-white/60">
              {items.length} {isProfile ? "profiles" : "posters"} · select any, then batch-render to {POSTER_DIMS[format].w}×{POSTER_DIMS[format].h} PNG
            </p>
          </div>
          <Link href={backHref} className="text-sm underline hover:text-white">← Back to Studio</Link>
        </header>

        {/* Batch toolbar */}
        <div className="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#0D142A]/90 px-4 py-3 backdrop-blur">
          <div className="flex overflow-hidden rounded-md border border-white/20 text-xs font-semibold">
            {(["wide", "square"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-2.5 py-1.5"
                style={{ background: format === f ? "#ffffff" : "transparent", color: format === f ? "#111" : "#fff" }}
              >
                {f === "wide" ? "16:9" : "1:1"}
              </button>
            ))}
          </div>
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
          {batch && !batch.running && <span className="text-xs text-emerald-400">✓ Rendered {batch.total} {isProfile ? "profiles" : "posters"}</span>}
          <span className="text-[11px] text-white/40">Tip: your browser may ask to allow multiple downloads.</span>
        </div>

        {!ready ? (
          <p className="text-white/50">Loading saved styles…</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {items.map((item) => (
              <RenderCard
                key={item.id}
                item={item}
                format={format}
                focused={item.id === focus}
                checked={selected.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
