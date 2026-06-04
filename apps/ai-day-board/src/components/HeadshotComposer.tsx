"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { Schedule } from "@/lib/types";
import { HEADSHOT_BACKGROUNDS, participantsFromSchedule } from "@/lib/poster";
import { resolveCutout, slugify } from "@/data/headshots";

const OUT = 1200; // native art size (square, RGBA)

/** One composed headshot: palette-pattern background + transparent cutout. */
function Composed({
  name,
  bg,
  zoom,
  offsetY,
  innerRef,
}: {
  name: string;
  bg: string;
  zoom: number;
  offsetY: number;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const r = resolveCutout(name);
  return (
    <div ref={innerRef} className="relative overflow-hidden" style={{ width: OUT, height: OUT }}>
      {/* layer 1: background pattern */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/headshots/bg/${bg}.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* layer 2: transparent person cutout, or initials fallback */}
      {r.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `translateY(${offsetY}%) scale(${zoom})`, transformOrigin: "center bottom" }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color: "#fff", fontFamily: "var(--font-poster-display)", fontWeight: 800, fontSize: OUT * 0.3 }}>
            {r.initials}
          </span>
        </div>
      )}
    </div>
  );
}

export function HeadshotComposer({ schedule }: { schedule: Schedule }) {
  const people = useMemo(() => participantsFromSchedule(schedule), [schedule]);
  const [selected, setSelected] = useState(people[0]?.name ?? "");
  const [bg, setBg] = useState("magenta-accent");
  const [zoom, setZoom] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const previewW = 360;

  async function exportOne(node: HTMLElement, name: string, bgId: string) {
    const url = await toPng(node, { width: OUT, height: OUT, pixelRatio: 1, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `headshot_${slugify(name)}_${bgId}.png`;
    a.click();
    await new Promise((r) => setTimeout(r, 350));
  }

  async function downloadCurrent() {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      await exportOne(nodeRef.current, selected, bg);
    } finally {
      setBusy(false);
    }
  }

  // Batch: render every person on the current backdrop, off-screen, and export.
  async function downloadAll() {
    setBatch({ done: 0, total: people.length });
    for (let i = 0; i < people.length; i++) {
      const node = document.getElementById(`batch-${people[i].id}`);
      if (node) await exportOne(node, people[i].name, bg);
      setBatch({ done: i + 1, total: people.length });
    }
    setTimeout(() => setBatch(null), 4000);
  }

  return (
    <div className="min-h-screen bg-[#0D142A] text-white">
      <div className="mx-auto max-w-[1100px] px-6 py-6">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Headshot Composer</h1>
            <p className="text-sm text-white/60">
              Project AIR · two-layer branded headshots (palette background + transparent cutout) · export 1200×1200 PNG
            </p>
          </div>
          <Link href="/profile" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            Profile Studio →
          </Link>
        </header>

        {batch && (
          <div className="mb-4 rounded-lg bg-emerald-600/80 px-4 py-2 text-sm font-medium">
            Rendering {batch.done}/{batch.total}…
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Stage */}
          <div>
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10" style={{ width: previewW }}>
              <div style={{ width: previewW, height: previewW, overflow: "hidden" }}>
                <div style={{ width: OUT, height: OUT, transform: `scale(${previewW / OUT})`, transformOrigin: "top left" }}>
                  <Composed name={selected} bg={bg} zoom={zoom} offsetY={offsetY} innerRef={nodeRef} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={downloadCurrent}
                disabled={busy}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#111] disabled:opacity-50"
              >
                {busy ? "Rendering…" : `Download ${OUT}×${OUT}`}
              </button>
              <button
                onClick={downloadAll}
                disabled={Boolean(batch)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Download all {people.length} on this backdrop
              </button>
            </div>

            {/* People */}
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">Person ({people.length})</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {people.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.name)}
                    className="rounded-lg border px-3 py-2 text-left text-xs"
                    style={{ borderColor: p.name === selected ? "#67FAE0" : "rgba(255,255,255,0.12)", background: p.name === selected ? "rgba(255,255,255,0.08)" : "transparent" }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <aside className="space-y-5">
            <section className="space-y-2">
              <h3 className="border-b border-white/10 pb-1 text-[11px] font-semibold uppercase tracking-widest text-white/45">Backdrop</h3>
              <div className="flex flex-wrap gap-2">
                {HEADSHOT_BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBg(b.id)}
                    title={b.label}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ background: b.swatch, borderColor: b.id === bg ? "#fff" : "transparent", outline: b.id === bg ? `2px solid ${b.swatch}` : "none" }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-white/35">10 options: each palette in its base and accent tone.</p>
            </section>

            <section className="space-y-2">
              <h3 className="border-b border-white/10 pb-1 text-[11px] font-semibold uppercase tracking-widest text-white/45">Framing</h3>
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-white/55">Zoom</span>
                <input type="range" min={1} max={1.6} step={0.02} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="min-w-0 flex-1" style={{ accentColor: "#67FAE0" }} />
                <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">{zoom.toFixed(2)}×</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-white/55">Y ⇅</span>
                <input type="range" min={-20} max={20} step={1} value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="min-w-0 flex-1" style={{ accentColor: "#67FAE0" }} />
                <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">{offsetY}%</span>
              </div>
              <p className="text-[10px] text-white/35">Zoom/Y reframe the current export only (not the batch).</p>
            </section>
          </aside>
        </div>

        {/* Off-screen batch render targets (one per person, current backdrop). */}
        <div style={{ position: "fixed", left: -99999, top: 0 }} aria-hidden>
          {people.map((p) => (
            <div key={p.id} id={`batch-${p.id}`} style={{ width: OUT, height: OUT }}>
              <Composed name={p.name} bg={bg} zoom={1} offsetY={0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
