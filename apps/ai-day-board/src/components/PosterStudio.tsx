"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Schedule } from "@/lib/types";
import {
  POSTER_VARIANTS,
  HEADSHOT_BACKGROUNDS,
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
  participantsFromSchedule,
  sessionToPoster,
  profileToPoster,
  defaultSessionStyle,
  defaultProfileStyle,
  DEFAULT_PROFILE_TAG,
  TRACK_SCHEME,
  PROFILE_COMPS,
  PROFILE_POS,
  PROFILE_SCALE,
  compTransform,
  type PosterSlots,
  type SiteId,
  type RingStyle,
  type TopStyle,
  type SessionStyle,
  type PosterFormat,
  type ProfileComp,
  type CompTransform,
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

export function PosterStudio({
  schedule: initialSchedule,
  fixedFormat,
  title = "Poster Studio",
  mode = "sessions",
}: {
  schedule: Schedule;
  fixedFormat?: PosterFormat;
  title?: string;
  mode?: "sessions" | "profiles";
}) {
  const isProfile = mode === "profiles";
  const [schedule, setSchedule] = useState(initialSchedule);
  const entries = useMemo(
    () => (isProfile ? participantsFromSchedule(schedule) : posterEntriesFromSchedule(schedule)),
    [schedule, isProfile]
  );
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [flash, setFlash] = useState<{ text: string; error?: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [format, setFormat] = useState<PosterFormat>(fixedFormat ?? "wide");

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

  const selected = (entries as { id: string }[]).find((e) => e.id === selectedId) ?? entries[0];
  const selectedSession = isProfile ? null : (selected as import("@/lib/poster").PosterEntry);
  const selectedPerson = isProfile ? (selected as import("@/lib/poster").ParticipantEntry) : null;
  const track = selectedSession ? selectedSession.session.track : "explore";
  const baseStyle = isProfile ? defaultProfileStyle() : defaultSessionStyle(track);
  const style: SessionStyle = { ...baseStyle, ...overrides[selected.id] };
  const variant = getVariant(style.variantId);
  const tagText = (style.tagText ?? DEFAULT_PROFILE_TAG).trim() || DEFAULT_PROFILE_TAG;
  const data = isProfile
    ? profileToPoster(selectedPerson!.name, tagText)
    : sessionToPoster(selectedSession!.session, style.site, selectedSession!.time);
  // On a profile, the poster is about the individual — hide session-driven slots.
  const renderSlots: PosterSlots = isProfile
    ? { ...style.slots, sessionTitle: false, role: false, location: false, room: false, time: false }
    : style.slots;
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
  // Per-component transform (profile mode): merge one field into one component.
  function patchLayout(comp: ProfileComp, p: Partial<CompTransform>) {
    patch({ layout: { ...style.layout, [comp]: { ...style.layout?.[comp], ...p } } });
  }
  function applyLayoutAll(comp: ProfileComp, p: Partial<CompTransform>, label: string) {
    setOverrides((prev) => {
      const next: StyleOverrides = { ...prev };
      for (const e of entries) {
        const prevLayout = next[e.id]?.layout ?? {};
        next[e.id] = { ...next[e.id], layout: { ...prevLayout, [comp]: { ...prevLayout[comp], ...p } } };
      }
      saveStyleOverrides(next);
      return next;
    });
    setFlash({ text: `${label} applied to all ${entries.length} profiles` });
    window.setTimeout(() => setFlash(null), 2200);
  }
  function resetToDefault() {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      saveStyleOverrides(next);
      return next;
    });
  }
  // Give every entry a randomly-picked palette; the headshot backdrop follows
  // the new scheme's accent so each profile stays internally coordinated.
  function randomizePalettes() {
    setOverrides((prev) => {
      const next: StyleOverrides = { ...prev };
      for (const e of entries) {
        const v = POSTER_VARIANTS[Math.floor(Math.random() * POSTER_VARIANTS.length)];
        next[e.id] = { ...next[e.id], variantId: v.id, headshotBg: `${v.id}-accent` };
      }
      saveStyleOverrides(next);
      return next;
    });
    setFlash({ text: `Randomized palettes across all ${entries.length} ${isProfile ? "profiles" : "posters"}` });
    window.setTimeout(() => setFlash(null), 2400);
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
  const renderBase = isProfile ? "/render?mode=profiles" : "/render";
  const renderHref = `${renderBase}${renderBase.includes("?") ? "&" : "?"}focus=${encodeURIComponent(selected.id)}`;

  // Capture the current poster's sizing/position as the proposed factory
  // default (what every new browser/user starts with). Copies JSON to paste in.
  function copyDefaults() {
    const d = {
      ringSize: style.ringSize,
      topSize: style.topSize,
      topOpacity: style.topOpacity,
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
            <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
            <p className="text-sm text-white/60">
              Project AIR · {fixedFormat === "square" ? "1:1 profile / social posters" : "slot-based TV poster system"} · synced{" "}
              {new Date(schedule.lastSynced).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {fixedFormat ? (
              <Link
                href={fixedFormat === "square" ? "/posters" : "/profile"}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                {fixedFormat === "square" ? "Poster Studio (16:9) →" : "Profile Studio (1:1) →"}
              </Link>
            ) : (
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
            )}
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
            <Link href={renderBase} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#111]" style={{ background: accent }}>
              Render queue →
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
            <div
              className="overflow-hidden shadow-2xl ring-1 ring-white/10"
              style={isProfile ? { maxWidth: "70%" } : undefined}
            >
              <Poster
                data={data}
                variant={variant}
                format={format}
                slots={renderSlots}
                ringStyle={style.ringStyle}
                topStyle={style.topStyle}
                ringSize={style.ringSize}
                topSize={style.topSize}
                topOpacity={style.topOpacity}
                topFlip={style.topFlip}
                portraitSize={style.portraitSize}
                headshotBg={style.headshotBg}
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
                layout={style.layout}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
              <span>
                {isProfile ? (
                  <>Profile: <span className="text-white/80">{selectedPerson!.name}</span></>
                ) : (
                  <>Default scheme for {track.toUpperCase()}: <span className="uppercase text-white/80">{TRACK_SCHEME[track]}</span></>
                )}
                {isOverridden && <span className="ml-2 text-amber-300">· customized</span>}
              </span>
              <div className="flex items-center gap-3">
                {isOverridden && (
                  <button onClick={resetToDefault} className="underline hover:text-white">Reset to default</button>
                )}
                <Link href={renderHref} className="underline hover:text-white">Send this to render →</Link>
              </div>
            </div>

            {/* Picker */}
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                {isProfile ? "Participant" : "Session"} ({entries.length})
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {(entries as { id: string }[]).map((e) => {
                  const active = e.id === selected.id;
                  const customized = Boolean(overrides[e.id]);
                  const person = isProfile ? (e as import("@/lib/poster").ParticipantEntry) : null;
                  const sess = isProfile ? null : (e as import("@/lib/poster").PosterEntry);
                  const tagLine = person
                    ? ((overrides[e.id]?.tagText ?? DEFAULT_PROFILE_TAG).trim() || DEFAULT_PROFILE_TAG)
                    : `${sess!.time} · ${sess!.session.instructors.join(" + ") || "—"}`;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className="rounded-lg border px-3 py-2 text-left text-xs transition"
                      style={{ borderColor: active ? accent : "rgba(255,255,255,0.12)", background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
                    >
                      <div className={`font-semibold text-white/90 ${person ? "text-sm" : ""}`}>
                        {person ? person.name : sess!.session.title}
                        {customized && <span className="ml-1 text-amber-300">•</span>}
                      </div>
                      <div className="text-[11px] text-white/50">{tagLine}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <aside className="space-y-5">
            {isProfile && (
              <Group title="Ambassador text" onAll={() => applyToAll({ tagText: tagText }, `Text "${tagText}"`)}>
                <input
                  type="text"
                  value={style.tagText ?? DEFAULT_PROFILE_TAG}
                  onChange={(e) => patch({ tagText: e.target.value })}
                  placeholder={DEFAULT_PROFILE_TAG}
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                />
                <p className="text-[10px] text-white/35">
                  Shows under the name. Defaults to “{DEFAULT_PROFILE_TAG}”. Use “all” to set every participant at once.
                </p>
              </Group>
            )}

            <Group title="Color">
              <div className="flex flex-wrap items-center gap-2">
                {POSTER_VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => patch({ variantId: v.id, headshotBg: `${v.id}-accent` })}
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
              <button
                onClick={randomizePalettes}
                className="mt-1 w-full rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                🎲 Randomize all {isProfile ? "profiles" : "posters"}
              </button>
            </Group>

            <Group title="Ring badge">
              <Row label="Shape" onAll={() => applyToAll({ ringStyle: style.ringStyle }, `Ring shape "${style.ringStyle}"`)}>
                <Chips options={RING_STYLES as readonly string[]} value={style.ringStyle} accent={accent} onChange={(v) => patch({ ringStyle: v as RingStyle })} cap />
              </Row>
              {!isProfile && sizeRow("ringSize", "Size", RING_SIZE, "x", "Ring size")}
              {!isProfile && sizeRow("badgeOffsetX", "X ⇄", OFFSET_X, "px", "Badge+headshot X")}
              {!isProfile && <p className="pl-14 text-[10px] text-white/35">X moves the ring badge and headshot together.</p>}
            </Group>

            {!isProfile && (
              <Group title="Date &amp; track tag">
                {sizeRow("tagSize", "Tag", TEXT_SIZE, "x", "Track-tag size")}
                {sizeRow("dateSize", "Date", TEXT_SIZE, "x", "Date size")}
                <p className="pl-14 text-[10px] text-white/35">Track tag sits above the date, top-left.</p>
              </Group>
            )}

            <Group title="Headshot">
              {!isProfile && sizeRow("portraitSize", "Size", PORTRAIT_SIZE, "x", "Headshot size")}
              <Row label="Backdrop" onAll={() => applyToAll({ headshotBg: style.headshotBg }, "Headshot backdrop")}>
                <div className="flex flex-wrap gap-1.5">
                  {HEADSHOT_BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => patch({ headshotBg: b.id })}
                      title={b.label}
                      className="h-6 w-6 rounded-full border-2"
                      style={{ background: b.swatch, borderColor: b.id === style.headshotBg ? "#fff" : "transparent", outline: b.id === style.headshotBg ? `2px solid ${b.swatch}` : "none" }}
                    />
                  ))}
                </div>
              </Row>
            </Group>

            <Group title="Top edge">
              <Row label="Graphic" onAll={() => applyToAll({ topStyle: style.topStyle }, `Top graphic "${style.topStyle}"`)}>
                <Chips options={TOP_STYLES as readonly string[]} value={style.topStyle} accent={accent} onChange={(v) => patch({ topStyle: v as TopStyle })} />
              </Row>
              <Row label="Flip" onAll={() => applyToAll({ topFlip: style.topFlip }, `Top-edge flip ${style.topFlip ? "on" : "off"}`)}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={style.topFlip} onChange={() => patch({ topFlip: !style.topFlip })} />
                  <span className="text-white/70">Mirror horizontally</span>
                </label>
              </Row>
              {!isProfile && sizeRow("topSize", "Size", TOP_SIZE, "x", "Top size")}
              {!isProfile && (
                <Row label="Opacity" onAll={() => applyToAll({ topOpacity: style.topOpacity }, `Top opacity ${Math.round(style.topOpacity * 100)}%`)}>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={style.topOpacity}
                      onChange={(e) => patch({ topOpacity: Number(e.target.value) })}
                      className="min-w-0 flex-1"
                      style={{ accentColor: variant.accent }}
                    />
                    <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">{Math.round(style.topOpacity * 100)}%</span>
                  </div>
                </Row>
              )}
              {!isProfile && sizeRow("topOffsetX", "X", OFFSET_X, "px", "Top-edge X")}
              {!isProfile && sizeRow("topOffsetY", "Y", OFFSET_Y, "px", "Top-edge Y")}
            </Group>

            {!isProfile && (
              <Group title="Bottom-left">
                {sizeRow("bottomOffsetX", "X", OFFSET_X, "px", "Bottom-left X")}
                {sizeRow("bottomOffsetY", "Y", OFFSET_Y, "px", "Bottom-left Y")}
              </Group>
            )}

            {!isProfile && (
              <Group title="Squiggle">
                {sizeRow("squiggleSize", "Size", SQUIGGLE_SIZE, "x", "Squiggle size")}
                {sizeRow("squiggleOffsetX", "X", OFFSET_X, "px", "Squiggle X")}
                {sizeRow("squiggleOffsetY", "Y", OFFSET_Y, "px", "Squiggle Y")}
              </Group>
            )}

            {isProfile && (
              <section className="space-y-4">
                <h3 className="border-b border-white/10 pb-1 text-[11px] font-semibold uppercase tracking-widest text-white/45">
                  Position, scale &amp; opacity
                </h3>
                {PROFILE_COMPS.map(({ id, label }) => {
                  const t: CompTransform = compTransform(style.layout, id);
                  return (
                    <div key={id} className="space-y-2 rounded-lg border border-white/10 p-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">{label}</div>
                      <Row label="X ⇄" onAll={() => applyLayoutAll(id, { x: t.x }, `${label} X`)}>
                        <MiniSlider value={t.x} range={PROFILE_POS} unit="px" accent={accent} onChange={(v) => patchLayout(id, { x: v })} />
                      </Row>
                      <Row label="Y ⇅" onAll={() => applyLayoutAll(id, { y: t.y }, `${label} Y`)}>
                        <MiniSlider value={t.y} range={PROFILE_POS} unit="px" accent={accent} onChange={(v) => patchLayout(id, { y: v })} />
                      </Row>
                      <Row label="Scale" onAll={() => applyLayoutAll(id, { scale: t.scale }, `${label} scale`)}>
                        <MiniSlider value={t.scale} range={PROFILE_SCALE} unit="x" accent={accent} onChange={(v) => patchLayout(id, { scale: v })} />
                      </Row>
                      <Row label="Fade" onAll={() => applyLayoutAll(id, { opacity: t.opacity }, `${label} opacity`)}>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={t.opacity}
                            onChange={(e) => patchLayout(id, { opacity: Number(e.target.value) })}
                            className="min-w-0 flex-1"
                            style={{ accentColor: accent }}
                          />
                          <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">{Math.round(t.opacity * 100)}%</span>
                        </div>
                      </Row>
                    </div>
                  );
                })}
              </section>
            )}

            {!isProfile && (
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
            )}

            <Group title="Elements" onAll={() => applyToAll({ slots: { ...style.slots } }, "Element visibility")}>
              <div className="grid grid-cols-2 gap-1.5">
                {SLOT_LABELS.filter(({ key }) => !isProfile || !["sessionTitle", "role", "location", "room", "time"].includes(key)).map(({ key, label }) => (
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
