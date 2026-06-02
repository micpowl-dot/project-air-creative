"use client";

import { useMemo, useState } from "react";
import type { Schedule, ScheduleSlot } from "@/lib/types";
import {
  COLOR_SCHEMES,
  LAYOUTS,
  DEFAULT_SCHEME,
  DEFAULT_LAYOUT,
  getScheme,
  schemeVars,
} from "@/lib/theme";
import { SessionCard } from "./SessionCard";
import { Headshot } from "./Headshot";

function FullWidthSlot({ slot }: { slot: ScheduleSlot }) {
  const hasPeople = (slot.people?.length ?? 0) > 0;
  return (
    <div
      className="rounded-xl border px-6 py-5 text-center"
      style={{
        background: "var(--surface-alt)",
        borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
      }}
    >
      <h3 className="font-display text-2xl text-[var(--ink)]">{slot.title}</h3>
      {hasPeople && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          {slot.people!.map((p) => (
            <span key={p} className="inline-flex items-center gap-2">
              <Headshot name={p} size={40} />
              <span className="text-sm font-medium text-[var(--ink)]">{p}</span>
            </span>
          ))}
        </div>
      )}
      {slot.rooms &&
        (slot.rooms.brookhaven || slot.rooms.andover || slot.rooms.newYork) && (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            {[
              slot.rooms.brookhaven && `Brookhaven (${slot.rooms.brookhaven})`,
              slot.rooms.andover && `Andover (${slot.rooms.andover})`,
              slot.rooms.newYork && `New York (${slot.rooms.newYork})`,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        )}
    </div>
  );
}

function TimeChip({ time }: { time: string }) {
  return (
    <div
      className="font-display text-xl font-semibold text-[var(--ink)]"
      style={{ minWidth: 64 }}
    >
      {time}
    </div>
  );
}

function GridLayout({ schedule }: { schedule: Schedule }) {
  return (
    <div className="space-y-4">
      {/* Track header */}
      <div className="grid grid-cols-[64px_repeat(3,1fr)] gap-4">
        <div />
        {schedule.tracks.map((t) => (
          <div
            key={t.id}
            className="rounded-lg px-4 py-3 text-center"
            style={{ background: `var(--track-${t.id})` }}
          >
            <div
              className="font-display text-xl font-bold"
              style={{ color: "var(--bg)" }}
            >
              {t.name}
            </div>
            <div
              className="text-xs font-medium"
              style={{ color: "color-mix(in srgb, var(--bg) 75%, transparent)" }}
            >
              {t.subtitle}
            </div>
          </div>
        ))}
      </div>

      {schedule.slots.map((slot) => {
        if (slot.kind === "full") {
          return (
            <div
              key={slot.time}
              className="grid grid-cols-[64px_1fr] items-center gap-4"
            >
              <TimeChip time={slot.time} />
              <FullWidthSlot slot={slot} />
            </div>
          );
        }
        const byTrack = (id: string) =>
          slot.sessions?.find((s) => s.track === id);
        return (
          <div
            key={slot.time}
            className="grid grid-cols-[64px_repeat(3,1fr)] items-stretch gap-4"
          >
            <div className="flex items-center">
              <TimeChip time={slot.time} />
            </div>
            {schedule.tracks.map((t) => {
              const s = byTrack(t.id);
              return (
                <div key={t.id}>
                  {s ? <SessionCard session={s} /> : <div />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AgendaLayout({ schedule }: { schedule: Schedule }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {schedule.slots.map((slot) => (
        <section key={slot.time}>
          <div className="mb-2 flex items-baseline gap-3">
            <TimeChip time={slot.time} />
            <div
              className="h-px flex-1"
              style={{ background: "color-mix(in srgb, var(--ink) 15%, transparent)" }}
            />
          </div>
          {slot.kind === "full" ? (
            <FullWidthSlot slot={slot} />
          ) : (
            <div className="space-y-3">
              {slot.sessions!.map((s) => (
                <SessionCard key={s.track + s.title} session={s} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function SpotlightLayout({ schedule }: { schedule: Schedule }) {
  const [i, setI] = useState(0);
  const slot = schedule.slots[i];
  const prev = () => setI((n) => (n - 1 + schedule.slots.length) % schedule.slots.length);
  const next = () => setI((n) => (n + 1) % schedule.slots.length);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prev}
          className="rounded-lg border px-4 py-2 text-sm text-[var(--ink)]"
          style={{ borderColor: "var(--accent)" }}
        >
          ‹ Prev
        </button>
        <div className="font-display text-3xl font-bold text-[var(--ink)]">
          {slot.time}
        </div>
        <button
          onClick={next}
          className="rounded-lg border px-4 py-2 text-sm text-[var(--ink)]"
          style={{ borderColor: "var(--accent)" }}
        >
          Next ›
        </button>
      </div>
      {slot.kind === "full" ? (
        <FullWidthSlot slot={slot} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {slot.sessions!.map((s) => (
            <SessionCard key={s.track + s.title} session={s} />
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-[var(--ink-soft)]">
        {i + 1} / {schedule.slots.length}
      </p>
    </div>
  );
}

export function Board({ schedule }: { schedule: Schedule }) {
  const [schemeId, setSchemeId] = useState(DEFAULT_SCHEME);
  const [layoutId, setLayoutId] = useState(DEFAULT_LAYOUT);
  const scheme = useMemo(() => getScheme(schemeId), [schemeId]);

  const synced = new Date(schedule.lastSynced);

  return (
    <div
      style={{ ...schemeVars(scheme), background: "var(--bg)", color: "var(--ink)" }}
      className="min-h-full"
    >
      {/* Control bar — the override panel */}
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-6 py-3 backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            Scheme
          </span>
          {COLOR_SCHEMES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSchemeId(s.id)}
              title={s.name}
              className="h-6 w-6 rounded-full border-2"
              style={{
                background: s.bg,
                borderColor: s.id === schemeId ? s.accent : "transparent",
                outline:
                  s.id === schemeId ? `1px solid ${s.accent}` : "none",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            Layout
          </span>
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayoutId(l.id)}
              className="rounded-md px-2.5 py-1 text-xs font-medium"
              style={{
                background:
                  l.id === layoutId ? "var(--accent)" : "var(--surface)",
                color: l.id === layoutId ? "var(--bg)" : "var(--ink)",
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className="px-6 pb-2 pt-8 text-center">
        <h1 className="font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
          {schedule.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Live from The Drop · last synced{" "}
          {synced.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </header>

      <main className="px-6 pb-16 pt-4">
        {layoutId === "grid" && <GridLayout schedule={schedule} />}
        {layoutId === "agenda" && <AgendaLayout schedule={schedule} />}
        {layoutId === "spotlight" && <SpotlightLayout schedule={schedule} />}
      </main>
    </div>
  );
}
