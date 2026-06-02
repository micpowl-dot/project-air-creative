"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Schedule } from "@/lib/types";
import {
  POSTER_VARIANTS,
  SITES,
  RING_STYLES,
  TOP_STYLES,
  RING_SIZE,
  TOP_SIZE,
  getVariant,
  posterEntriesFromSchedule,
  sessionToPoster,
  defaultSessionStyle,
  TRACK_SCHEME,
  type PosterSlots,
  type SiteId,
  type RingStyle,
  type TopStyle,
  type SessionStyle,
} from "@/lib/poster";
import { Poster } from "./Poster";
import { loadStyleOverrides, saveStyleOverrides, type StyleOverrides } from "@/lib/poster-store";

const SLOT_LABELS: { key: keyof PosterSlots; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "eventMark", label: "Top graphic" },
  { key: "ringBadge", label: "Ring badge" },
  { key: "portrait", label: "Headshot" },
  { key: "name", label: "Name" },
  { key: "sessionTitle", label: "Session title" },
  { key: "role", label: "Job title" },
  { key: "tag", label: "Track tag" },
  { key: "location", label: "Location" },
  { key: "room", label: "Room" },
  { key: "time", label: "Time" },
  { key: "lockup", label: "AI DAY logo" },
];

export function PosterStudio({ schedule }: { schedule: Schedule }) {
  const entries = useMemo(() => posterEntriesFromSchedule(schedule), [schedule]);
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const [overrides, setOverrides] = useState<StyleOverrides>({});

  // Load saved per-session overrides from the browser once on mount.
  useEffect(() => setOverrides(loadStyleOverrides()), []);

  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];
  const track = selected.session.track;
  const style: SessionStyle = { ...defaultSessionStyle(track), ...overrides[selected.id] };
  const variant = getVariant(style.variantId);
  const data = sessionToPoster(selected.session, style.site, selected.time);

  function patch(p: Partial<SessionStyle>) {
    setOverrides((prev) => {
      const next = { ...prev, [selected.id]: { ...prev[selected.id], ...p } };
      saveStyleOverrides(next);
      return next;
    });
  }
  function patchSlot(k: keyof PosterSlots) {
    patch({ slots: { ...style.slots, [k]: !style.slots[k] } });
  }
  function resetToDefault() {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      saveStyleOverrides(next);
      return next;
    });
  }
  const isOverridden = Boolean(overrides[selected.id]);

  const renderHref = `/render?focus=${encodeURIComponent(selected.id)}`;

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-[#f5f3ee]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Poster Studio</h1>
            <p className="text-sm text-white/60">
              Project AIR · slot-based TV poster system · color coordinated by track
            </p>
          </div>
          <Link
            href="/render"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#111]"
            style={{ background: variant.accent }}
          >
            Render queue → 1920×1080
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Stage (square corners) */}
          <div>
            <div className="overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Poster
                data={data}
                variant={variant}
                slots={style.slots}
                ringStyle={style.ringStyle}
                topStyle={style.topStyle}
                ringSize={style.ringSize}
                topSize={style.topSize}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
              <span>
                Default scheme for {track.toUpperCase()}:{" "}
                <span className="uppercase text-white/80">{TRACK_SCHEME[track]}</span>
                {isOverridden && <span className="ml-2 text-amber-300">· customized</span>}
              </span>
              <div className="flex items-center gap-3">
                {isOverridden && (
                  <button onClick={resetToDefault} className="underline hover:text-white">
                    Reset to default
                  </button>
                )}
                <Link href={renderHref} className="underline hover:text-white">
                  Send this to render →
                </Link>
              </div>
            </div>

            {/* Session picker */}
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Session ({entries.length})
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {entries.map((e) => {
                  const active = e.id === selected.id;
                  const customized = Boolean(overrides[e.id]);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className="rounded-lg border px-3 py-2 text-left text-xs transition"
                      style={{
                        borderColor: active ? variant.accent : "rgba(255,255,255,0.12)",
                        background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      }}
                    >
                      <div className="font-semibold text-white/90">
                        {e.session.title}
                        {customized && <span className="ml-1 text-amber-300">•</span>}
                      </div>
                      <div className="text-white/50">
                        {e.time} · {e.session.instructors.join(" + ") || "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <aside className="space-y-5">
            <Control label="Color variant (override)">
              <div className="flex flex-wrap gap-2">
                {POSTER_VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => patch({ variantId: v.id })}
                    title={v.name}
                    className="h-9 w-9 rounded-full border-2"
                    style={{
                      background: v.bg,
                      borderColor: v.id === style.variantId ? v.accent : "transparent",
                      outline: v.id === style.variantId ? `2px solid ${v.accent}` : "none",
                    }}
                  />
                ))}
              </div>
            </Control>

            <Control label="Ring badge shape">
              <Chips
                options={RING_STYLES as readonly string[]}
                value={style.ringStyle}
                accent={variant.accent}
                onChange={(v) => patch({ ringStyle: v as RingStyle })}
                cap
              />
            </Control>

            <Control label={`Ring badge size — ${style.ringSize.toFixed(2)}×`}>
              <input
                type="range"
                min={RING_SIZE.min}
                max={RING_SIZE.max}
                step={0.05}
                value={style.ringSize}
                onChange={(e) => patch({ ringSize: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: variant.accent }}
              />
            </Control>

            <Control label="Top-edge graphic">
              <Chips
                options={TOP_STYLES as readonly string[]}
                value={style.topStyle}
                accent={variant.accent}
                onChange={(v) => patch({ topStyle: v as TopStyle })}
              />
            </Control>

            <Control label={`Top-edge size — ${style.topSize.toFixed(2)}×`}>
              <input
                type="range"
                min={TOP_SIZE.min}
                max={TOP_SIZE.max}
                step={0.05}
                value={style.topSize}
                onChange={(e) => patch({ topSize: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: variant.accent }}
              />
            </Control>

            <Control label="Location (drives room)">
              <div className="flex flex-wrap gap-2">
                {SITES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => patch({ site: s.id as SiteId })}
                    className="rounded-md px-3 py-1.5 text-sm"
                    style={{
                      background: s.id === style.site ? variant.accent : "rgba(255,255,255,0.08)",
                      color: s.id === style.site ? "#111" : "#fff",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/40">
                Room here: <span className="text-white/70">{data.room}</span>
              </p>
            </Control>

            <Control label="Slots (toggle elements)">
              <div className="grid grid-cols-2 gap-1.5">
                {SLOT_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/5">
                    <input type="checkbox" checked={style.slots[key]} onChange={() => patchSlot(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </Control>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 text-xs uppercase tracking-wide text-white/50">{label}</div>
      {children}
    </section>
  );
}

function Chips({
  options,
  value,
  accent,
  onChange,
  cap,
}: {
  options: readonly string[];
  value: string;
  accent: string;
  onChange: (v: string) => void;
  cap?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-md px-2.5 py-1 text-xs ${cap ? "capitalize" : ""}`}
          style={{
            background: o === value ? accent : "rgba(255,255,255,0.08)",
            color: o === value ? "#111" : "#fff",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
