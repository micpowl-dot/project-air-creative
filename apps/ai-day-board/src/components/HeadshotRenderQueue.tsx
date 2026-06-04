"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { Schedule } from "@/lib/types";
import { HEADSHOT_BACKGROUNDS, participantsFromSchedule } from "@/lib/poster";
import { slugify } from "@/data/headshots";
import { ComposedHeadshot, HEADSHOT_OUT as OUT } from "./ComposedHeadshot";

async function exportNode(node: HTMLElement, name: string) {
  const url = await toPng(node, { width: OUT, height: OUT, pixelRatio: 1, cacheBust: true });
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  await new Promise((r) => setTimeout(r, 350));
}

function PersonCard({
  id,
  name,
  bg,
  checked,
  onToggle,
}: {
  id: string;
  name: string;
  bg: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const previewW = 220;

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await exportNode(ref.current, `headshot_${slugify(name)}_${bg}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id={`hs-card-${id}`}
      className="rounded-lg p-2"
      style={{ background: checked ? "rgba(255,255,255,0.08)" : "transparent" }}
    >
      <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-white/70">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {name}
      </label>
      <div style={{ width: previewW, height: previewW, overflow: "hidden", borderRadius: 8 }}>
        <div style={{ width: OUT, height: OUT, transform: `scale(${previewW / OUT})`, transformOrigin: "top left" }}>
          <div ref={ref} id={`hs-node-${id}`} style={{ width: OUT, height: OUT }}>
            <ComposedHeadshot name={name} bg={bg} />
          </div>
        </div>
      </div>
      <button
        onClick={download}
        disabled={busy}
        className="mt-2 w-full rounded-md px-3 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-50"
        style={{ background: "#67FAE0", width: previewW }}
      >
        {busy ? "Rendering…" : `Download ${OUT}×${OUT}`}
      </button>
    </div>
  );
}

export function HeadshotRenderQueue({ schedule }: { schedule: Schedule }) {
  const people = useMemo(() => participantsFromSchedule(schedule), [schedule]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [globalBg, setGlobalBg] = useState("magenta-accent");
  const [bgOverride, setBgOverride] = useState<Record<string, string>>({});
  const [batch, setBatch] = useState<{ running: boolean; done: number; total: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelected(new Set(people.map((p) => p.id)));
    setReady(true);
  }, [people]);

  const bgFor = (id: string) => bgOverride[id] ?? globalBg;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = () => setSelected(new Set(people.map((p) => p.id)));
  const deselectAll = () => setSelected(new Set());

  // Pick a global backdrop for everyone (clears per-person overrides).
  function pickGlobal(bg: string) {
    setGlobalBg(bg);
    setBgOverride({});
  }
  // Give every person a random backdrop for variety.
  function randomize() {
    const next: Record<string, string> = {};
    for (const p of people) next[p.id] = HEADSHOT_BACKGROUNDS[Math.floor(Math.random() * HEADSHOT_BACKGROUNDS.length)].id;
    setBgOverride(next);
  }

  async function renderSelected() {
    const chosen = people.filter((p) => selected.has(p.id));
    setBatch({ running: true, done: 0, total: chosen.length });
    for (let i = 0; i < chosen.length; i++) {
      const p = chosen[i];
      const node = document.getElementById(`hs-node-${p.id}`);
      if (node) await exportNode(node, `headshot_${slugify(p.name)}_${bgFor(p.id)}.png`);
      setBatch({ running: true, done: i + 1, total: chosen.length });
    }
    setBatch({ running: false, done: chosen.length, total: chosen.length });
    setTimeout(() => setBatch(null), 4000);
  }

  return (
    <div className="min-h-screen bg-[#0D142A] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Headshot Render Queue</h1>
            <p className="text-sm text-white/60">
              {people.length} people · select any, pick a backdrop (or randomize), then batch-render 1200×1200 PNG
            </p>
          </div>
          <Link href="/headshot-composer" className="text-sm underline hover:text-white">← Back to Composer</Link>
        </header>

        {/* Toolbar */}
        <div className="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#0D142A]/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] uppercase tracking-wide text-white/45">Backdrop</span>
            {HEADSHOT_BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => pickGlobal(b.id)}
                title={b.label}
                className="h-6 w-6 rounded-full border-2"
                style={{ background: b.swatch, borderColor: globalBg === b.id && Object.keys(bgOverride).length === 0 ? "#fff" : "transparent", outline: globalBg === b.id && Object.keys(bgOverride).length === 0 ? `2px solid ${b.swatch}` : "none" }}
              />
            ))}
          </div>
          <button onClick={randomize} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">🎲 Randomize</button>
          <span className="ml-2 text-sm font-semibold">{selected.size} selected</span>
          <button onClick={selectAll} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Select all</button>
          <button onClick={deselectAll} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Deselect all</button>
          <button
            onClick={renderSelected}
            disabled={selected.size === 0 || batch?.running}
            className="rounded-md px-4 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-40"
            style={{ background: "#67FAE0" }}
          >
            {batch?.running ? `Rendering ${batch.done}/${batch.total}…` : `Render selected (${selected.size})`}
          </button>
          {batch && !batch.running && <span className="text-xs text-emerald-400">✓ Rendered {batch.total} headshots</span>}
          <span className="text-[11px] text-white/40">Tip: your browser may ask to allow multiple downloads.</span>
        </div>

        {!ready ? (
          <p className="text-white/50">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {people.map((p) => (
              <PersonCard
                key={p.id}
                id={p.id}
                name={p.name}
                bg={bgFor(p.id)}
                checked={selected.has(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
