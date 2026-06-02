"use client";

import { useEffect, useRef, useState } from "react";
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

function RenderCard({
  entry,
  style,
  focused,
}: {
  entry: PosterEntry;
  style: SessionStyle;
  focused: boolean;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const variant = getVariant(style.variantId);
  const data = sessionToPoster(entry.session, style.site, entry.time);
  const previewW = 560;

  async function download() {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      const url = await toPng(nodeRef.current, {
        width: OUT_W,
        height: OUT_H,
        pixelRatio: 1,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `aiday_${slugify(entry.session.title)}_${data.location || ""}_${style.variantId}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id={`card-${entry.id}`}
      className="rounded-lg p-3"
      style={{
        background: focused ? "rgba(255,255,255,0.08)" : "transparent",
        outline: focused ? `2px solid ${variant.accent}` : "none",
      }}
    >
      {/* scaled preview; the inner node is true 1920x1080 for export */}
      <div style={{ width: previewW, height: (previewW * OUT_H) / OUT_W, overflow: "hidden" }}>
        <div
          style={{
            width: OUT_W,
            height: OUT_H,
            transform: `scale(${previewW / OUT_W})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={nodeRef} style={{ width: OUT_W, height: OUT_H }}>
            <Poster
              data={data}
              variant={variant}
              slots={style.slots}
              ringStyle={style.ringStyle}
              topStyle={style.topStyle}
              ringSize={style.ringSize}
              topSize={style.topSize}
              portraitSize={style.portraitSize}
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
          <div>
            {entry.time} · {data.location} · {style.variantId}
          </div>
        </div>
        <button
          onClick={download}
          disabled={busy}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-[#111] disabled:opacity-50"
          style={{ background: variant.accent }}
        >
          {busy ? "Rendering…" : "Download 1920×1080"}
        </button>
      </div>
    </div>
  );
}

export function RenderQueue({ schedule, focus }: { schedule: Schedule; focus?: string }) {
  const entries = posterEntriesFromSchedule(schedule);
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOverrides(loadStyleOverrides());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && focus) {
      document.getElementById(`card-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [ready, focus]);

  const ordered = focus ? [...entries].sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : 0)) : entries;

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-[#f5f3ee]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Render Queue</h1>
            <p className="text-sm text-white/60">
              {entries.length} posters · each exports at exactly 1920×1080 PNG · uses your saved per-session styles
            </p>
          </div>
          <Link href="/posters" className="text-sm underline hover:text-white">
            ← Back to Studio
          </Link>
        </header>

        {!ready ? (
          <p className="text-white/50">Loading saved styles…</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {ordered.map((e) => (
              <RenderCard
                key={e.id}
                entry={e}
                style={{ ...defaultSessionStyle(e.session.track), ...overrides[e.id] }}
                focused={e.id === focus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
