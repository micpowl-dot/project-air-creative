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
  PORTRAIT_SIZE,
  SQUIGGLE_SIZE,
  TEXT_SIZE,
  OFFSET_X,
  OFFSET_Y,
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
  type PosterFormat,
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

export function PosterStudio({ schedule: initialSchedule }: { schedule: Schedule }) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const entries = useMemo(() => posterEntriesFromSchedule(schedule), [schedule]);
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [flash, setFlash] = useState<{ text: string; error?: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [format, setFormat] = useState<PosterFormat>("wide");

  useEffect(() => setOverrides(loadStyleOverrides()), []);

  async function refreshFromDrop() {
    setRefreshing(true);
    setFlash(null);
    try {
      const res = await fetch("/api/refresh", { cache: "no-store" });
      const body = await res.json();
      if (res.ok && body.schedule) {
        setSchedule(body.schedule);
        setFlash({ text: "Schedule refreshed from The Drop" });
      } else {
        setFlash({ text: body.message || "Refresh failed", error: true });
      }
    } catch (e) {
      setFlash({ text: `Refresh failed: ${String(e)}`, error: true });
    } finally {
      setRefreshing(false);
      window.setTimeout(() => setFlash(null), 6000);
    }
  }

  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];
  const track = selected.session.track;
  const style: SessionStyle = { ...defaultSessionStyle(track), ...overrides[selected.id] };
  const variant = getVariant(style.variantId);
  const data = sessionToPoster(selected.session, style.site, selected.time);
  const accent = variant.accent;

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
  function applyToAll(p: Partial<SessionStyle>, label: string) {
    setOverrides((prev) => {
      const next: StyleOverrides = { ...prev };
      for (const e of entries) next[e.id] = { ...next[e.id], ...p };
      saveStyleOverrides(next);
      return next;
    });
    setFlash({ text: `${label} applied to all ${entries.length} posters` });
    window.setTimeout(() => setFlash(null), 2200);
  }
  const isOverridden = Boolean(overrides[selected.id]);
  const renderHref = `/render?focus=${encodeURIComponent(selected.id)}`;

  // Capture the current poster's sizing/position as the proposed factory
  // default (what every new browser/user starts with). Copies JSON to paste in.
  function copyDefaults() {
    const d = {
      ringSize: style.ringSize,
      topSize: style.topSize,
      topFlip: style.topFlip,
      portraitSize: style.portraitSize,
      useAltHeadshot: style.useAltHeadshot,
      badgeOffsetX: style.badgeOffsetX,
      dateSize: style.dateSize,
      tagSize: style.tagSize,
      topOffsetX: style.topOffsetX,
      topOffsetY: style.topOffsetY,
      bottomOffsetX: style.bottomOffsetX,
      bottomOffsetY: style.bottomOffsetY,
      squiggleSize: style.squiggleSize,
      squiggleOffsetX: style.squiggleOffsetX,
      squiggleOffsetY: style.squiggleOffsetY,
    };
    navigator.clipboard?.writeText(JSON.stringify(d, null, 2));
    setFlash({ text: "Starting defaults copied to clipboard — share to make them the default for everyone" });
    window.setTimeout(() => setFlash(null), 5000);
  }

  // Helper to build a px/×-offset slider row bound to one style field.
  const sizeRow = (field: keyof SessionStyle, label: string, range: { min: number; max: number }, unit: "px" | "x", niceLabel: string) => (
    <Row label={label} onAll={() => applyToAll({ [field]: style[field] } as Partial<SessionStyle>, niceLabel)}>
      <MiniSlider
        value={style[field] as number}
        range={range}
        unit={unit}
        accent={accent}
        onChange={(v) => patch({ [field]: v } as Partial<SessionStyle>)}
      />
    </Row>
  );

  return (
    <div className="min-h-screen bg-[#0D142A] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Poster Studio</h1>
            <p className="text-sm text-white/60">
              Project AIR · slot-based TV poster system · synced{" "}
              {new Date(schedule.lastSynced).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/20 text-sm font-semibold">
              {(["wide", "square"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="px-3 py-2"
                  style={{ background: format === f ? accent : "transparent", color: format === f ? "#111" : "#fff" }}
                >
                  {f === "wide" ? "16:9" : "1:1"}
                </button>
              ))}
            </div>
            <button
              onClick={copyDefaults}
              title="Copy this poster's sizing as the proposed starting default for new users"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Copy starting defaults
            </button>
            <button
              onClick={refreshFromDrop}
              disabled={refreshing}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "↻ Refresh from The Drop"}
            </button>
            <Link href="/render" className="rounded-lg px-4 py-2 text-sm font-semibold text-[#111]" style={{ background: accent }}>
              Render queue → 1920×1080
            </Link>
          </div>
        </header>

        {flash && (
          <div
            className="mb-4 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: flash.error ? "#7f1d1d" : accent, color: flash.error ? "#fff" : "#111" }}
          >
            {flash.error ? "⚠ " : "✓ "}
            {flash.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          {/* Stage */}
          <div>
            <div className="overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Poster
                data={data}
                variant={variant}
                format={format}
                slots={style.slots}
                ringStyle={style.ringStyle}
                topStyle={style.topStyle}
                ringSize={style.ringSize}
                topSize={style.topSize}
                topFlip={style.topFlip}
                portraitSize={style.portraitSize}
                useAltHeadshot={style.useAltHeadshot}
                badgeOffsetX={style.badgeOffsetX}
                dateSize={style.dateSize}
                tagSize={style.tagSize}
                topOffsetX={style.topOffsetX}
                topOffsetY={style.topOffsetY}
                bottomOffsetX={style.bottomOffsetX}
                bottomOffsetY={style.bottomOffsetY}
                squiggleSize={style.squiggleSize}
                squiggleOffsetX={style.squiggleOffsetX}
                squiggleOffsetY={style.squiggleOffsetY}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
              <span>
                Default scheme for {track.toUpperCase()}: <span className="uppercase text-white/80">{TRACK_SCHEME[track]}</span>
                {isOverridden && <span className="ml-2 text-amber-300">· customized</span>}
              </span>
              <div className="flex items-center gap-3">
                {isOverridden && (
                  <button onClick={resetToDefault} className="underline hover:text-white">Reset to default</button>
                )}
                <Link href={renderHref} className="underline hover:text-white">Send this to render →</Link>
              </div>
            </div>

            {/* Session picker */}
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">Session ({entries.length})</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {entries.map((e) => {
                  const active = e.id === selected.id;
                  const customized = Boolean(overrides[e.id]);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className="rounded-lg border px-3 py-2 text-left text-xs transition"
                      style={{ borderColor: active ? accent : "rgba(255,255,255,0.12)", background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
                    >
                      <div className="font-semibold text-white/90">
                        {e.session.title}
                        {customized && <span className="ml-1 text-amber-300">•</span>}
                      </div>
                      <div className="text-white/50">{e.time} · {e.session.instructors.join(" + ") || "—"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <aside className="space-y-5">
            <Group title="Color">
              <div className="flex flex-wrap gap-2">
                {POSTER_VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => patch({ variantId: v.id })}
                    title={v.name}
                    className="h-8 w-8 rounded-full border-2"
                    style={{
                      background: v.bg,
                      borderColor: v.id === style.variantId ? v.accent : "transparent",
                      outline: v.id === style.variantId ? `2px solid ${v.accent}` : "none",
                    }}
                  />
                ))}
              </div>
            </Group>

            <Group title="Ring badge">
              <Row label="Shape" onAll={() => applyToAll({ ringStyle: style.ringStyle }, `Ring shape "${style.ringStyle}"`)}>
                <Chips options={RING_STYLES as readonly string[]} value={style.ringStyle} accent={accent} onChange={(v) => patch({ ringStyle: v as RingStyle })} cap />
              </Row>
              {sizeRow("ringSize", "Size", RING_SIZE, "x", "Ring size")}
              {sizeRow("badgeOffsetX", "X ⇄", OFFSET_X, "px", "Badge+headshot X")}
              <p className="pl-14 text-[10px] text-white/35">X moves the ring badge and headshot together.</p>
            </Group>

            <Group title="Date &amp; track tag">
              {sizeRow("tagSize", "Tag", TEXT_SIZE, "x", "Track-tag size")}
              {sizeRow("dateSize", "Date", TEXT_SIZE, "x", "Date size")}
              <p className="pl-14 text-[10px] text-white/35">Track tag sits above the date, top-left.</p>
            </Group>

            <Group title="Headshot">
              {sizeRow("portraitSize", "Size", PORTRAIT_SIZE, "x", "Headshot size")}
              <Row label="Alt" onAll={() => applyToAll({ useAltHeadshot: style.useAltHeadshot }, `Alternate headshot ${style.useAltHeadshot ? "on" : "off"}`)}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={style.useAltHeadshot} onChange={() => patch({ useAltHeadshot: !style.useAltHeadshot })} />
                  <span className="text-white/70">Use alternate art</span>
                </label>
              </Row>
            </Group>

            <Group title="Top edge">
              <Row label="Graphic" onAll={() => applyToAll({ topStyle: style.topStyle }, `Top graphic "${style.topStyle}"`)}>
                <Chips options={TOP_STYLES as readonly string[]} value={style.topStyle} accent={accent} onChange={(v) => patch({ topStyle: v as TopStyle })} />
              </Row>
              {sizeRow("topSize", "Size", TOP_SIZE, "x", "Top size")}
              <Row label="Flip" onAll={() => applyToAll({ topFlip: style.topFlip }, `Top-edge flip ${style.topFlip ? "on" : "off"}`)}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={style.topFlip} onChange={() => patch({ topFlip: !style.topFlip })} />
                  <span className="text-white/70">Mirror horizontally</span>
                </label>
              </Row>
              {sizeRow("topOffsetX", "X", OFFSET_X, "px", "Top-edge X")}
              {sizeRow("topOffsetY", "Y", OFFSET_Y, "px", "Top-edge Y")}
            </Group>

            <Group title="Bottom-left">
              {sizeRow("bottomOffsetX", "X", OFFSET_X, "px", "Bottom-left X")}
              {sizeRow("bottomOffsetY", "Y", OFFSET_Y, "px", "Bottom-left Y")}
            </Group>

            <Group title="Squiggle">
              {sizeRow("squiggleSize", "Size", SQUIGGLE_SIZE, "x", "Squiggle size")}
              {sizeRow("squiggleOffsetX", "X", OFFSET_X, "px", "Squiggle X")}
              {sizeRow("squiggleOffsetY", "Y", OFFSET_Y, "px", "Squiggle Y")}
            </Group>

            <Group title="Location (drives room)">
              <Row label="Site" onAll={() => applyToAll({ site: style.site }, `Location "${data.location}"`)}>
                <div className="flex flex-wrap gap-2">
                  {SITES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => patch({ site: s.id as SiteId })}
                      className="rounded-md px-3 py-1.5 text-sm"
                      style={{ background: s.id === style.site ? accent : "rgba(255,255,255,0.08)", color: s.id === style.site ? "#111" : "#fff" }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Row>
              <p className="text-xs text-white/40">Room here: <span className="text-white/70">{data.room}</span></p>
            </Group>

            <Group title="Elements" onAll={() => applyToAll({ slots: { ...style.slots } }, "Element visibility")}>
              <div className="grid grid-cols-2 gap-1.5">
                {SLOT_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/5">
                    <input type="checkbox" checked={style.slots[key]} onChange={() => patchSlot(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </Group>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** A titled section. Optional "Set all" applies the section's whole state. */
function Group({ title, children, onAll }: { title: string; children: React.ReactNode; onAll?: () => void }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-white/10 pb-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/45">{title}</h3>
        {onAll && <AllButton onClick={onAll} />}
      </div>
      {children}
    </section>
  );
}

/** A labelled control row: short label · control · optional "all". */
function Row({ label, children, onAll }: { label: string; children: React.ReactNode; onAll?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-white/55">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {onAll && <AllButton onClick={onAll} />}
    </div>
  );
}

function AllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Apply this value to every poster in the series"
      className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50 hover:bg-white/10 hover:text-white"
    >
      all
    </button>
  );
}

/** Slider with an inline value readout (px or ×). */
function MiniSlider({
  value,
  range,
  unit,
  accent,
  onChange,
}: {
  value: number;
  range: { min: number; max: number };
  unit: "px" | "x";
  accent: string;
  onChange: (v: number) => void;
}) {
  const step = unit === "px" ? 10 : 0.05;
  const shown = unit === "px" ? `${value}px` : `${value.toFixed(2)}×`;
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">{shown}</span>
    </div>
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
          className={`rounded-md px-2 py-1 text-[11px] ${cap ? "capitalize" : ""}`}
          style={{ background: o === value ? accent : "rgba(255,255,255,0.08)", color: o === value ? "#111" : "#fff" }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
