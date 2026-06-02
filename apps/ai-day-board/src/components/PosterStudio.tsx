"use client";

import { useMemo, useState } from "react";
import type { Schedule } from "@/lib/types";
import {
  POSTER_VARIANTS,
  SITES,
  DEFAULT_SLOTS,
  getVariant,
  posterEntriesFromSchedule,
  sessionToPoster,
  type PosterSlots,
  type SiteId,
} from "@/lib/poster";
import { Poster } from "./Poster";

const SLOT_LABELS: { key: keyof PosterSlots; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "eventMark", label: "AI DAY mark" },
  { key: "ringBadge", label: "Ring badge" },
  { key: "portrait", label: "Headshot" },
  { key: "name", label: "Name" },
  { key: "sessionTitle", label: "Session title" },
  { key: "role", label: "Job title" },
  { key: "tag", label: "Track tag" },
  { key: "location", label: "Location" },
  { key: "room", label: "Room" },
  { key: "time", label: "Time" },
  { key: "lockup", label: "Lockup" },
];

export function PosterStudio({ schedule }: { schedule: Schedule }) {
  const entries = useMemo(
    () => posterEntriesFromSchedule(schedule),
    [schedule]
  );
  const [variantId, setVariantId] = useState("magenta");
  const [site, setSite] = useState<SiteId>("brookhaven");
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const [slots, setSlots] = useState<PosterSlots>(DEFAULT_SLOTS);

  const variant = getVariant(variantId);
  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];
  const data = sessionToPoster(selected.session, site, selected.time);

  const toggle = (k: keyof PosterSlots) =>
    setSlots((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-[#f5f3ee]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-5">
          <h1 className="font-display text-3xl font-bold">Poster Studio</h1>
          <p className="text-sm text-white/60">
            Project AIR · slot-based TV poster system · data pulled live from the
            AI Day schedule
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Stage */}
          <div>
            <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
              <Poster data={data} variant={variant} slots={slots} />
            </div>

            {/* Session picker */}
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Session ({entries.length})
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {entries.map((e) => {
                  const active = e.id === selected.id;
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
                      </div>
                      <div className="text-white/50">
                        {e.time} · {e.session.instructors[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <aside className="space-y-6">
            <section>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Color variant
              </div>
              <div className="flex flex-wrap gap-2">
                {POSTER_VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    title={v.name}
                    className="h-9 w-9 rounded-full border-2"
                    style={{
                      background: v.bg,
                      borderColor: v.id === variantId ? v.accent : "transparent",
                      outline: v.id === variantId ? `2px solid ${v.accent}` : "none",
                    }}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Location (drives room)
              </div>
              <div className="flex flex-wrap gap-2">
                {SITES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSite(s.id)}
                    className="rounded-md px-3 py-1.5 text-sm"
                    style={{
                      background: s.id === site ? variant.accent : "rgba(255,255,255,0.08)",
                      color: s.id === site ? "#111" : "#fff",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/40">
                Room for this site: <span className="text-white/70">{data.room}</span>
              </p>
            </section>

            <section>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Slots (toggle elements)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SLOT_LABELS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={slots[key]}
                      onChange={() => toggle(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
