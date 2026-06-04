"use client";

import { useEffect, useMemo, useState } from "react";
import { AiDayLogo } from "./AiDayLogo";
import { Poster } from "./Poster";
import type { Schedule } from "@/lib/types";
import {
  posterEntriesFromSchedule,
  sessionToPoster,
  defaultSessionStyle,
  getVariant,
  HEADSHOT_BACKGROUNDS,
} from "@/lib/poster";

interface Story {
  name: string;
  text: string;
}

const COLUMNS = 5;
const BG = "#FB00FF";
const ACCENT = "#FFE500";
const INK = "#0D142A";

// How long each view stays on screen before alternating.
const WALL_MS = 32000;
const POSTERS_MS = 28000;
const POSTER_EACH_MS = 7000; // per-poster within the poster cycle

// Deterministic random palette backdrop per tile (stable across re-renders and
// the duplicated loop copy). Shows through transparent cutouts; real photos
// just cover it.
function bgForSrc(src: string): string {
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  const id = HEADSHOT_BACKGROUNDS[h % HEADSHOT_BACKGROUNDS.length].id;
  return `/headshots/bg/${id}.png`;
}

function Tile({ src, tilt }: { src: string; tilt: number }) {
  const bg = bgForSrc(src);
  return (
    <div className="mb-[3vh] inline-block rounded-[0.4vw] bg-white p-[0.6vw] shadow-2xl" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="relative overflow-hidden rounded-[0.2vw]" style={{ width: "100%", aspectRatio: "1 / 1", background: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}

/** The waterfall of photobooth photos + a rotating "AI helped me..." card. */
function WaterfallView({ images, stories, live }: { images: string[]; stories: Story[]; live: boolean }) {
  const [storyIdx, setStoryIdx] = useState(0);
  useEffect(() => {
    if (stories.length === 0) return;
    const id = setInterval(() => setStoryIdx((i) => (i + 1) % stories.length), 20000);
    return () => clearInterval(id);
  }, [stories.length]);

  const cols = useMemo(() => {
    const out: string[][] = Array.from({ length: COLUMNS }, () => []);
    images.forEach((src, i) => out[i % COLUMNS].push(src));
    return out;
  }, [images]);
  const story = stories[storyIdx];

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: BG }}>
      <style>{`@keyframes wall-fall { from { transform: translateY(-50%); } to { transform: translateY(0); } }`}</style>
      <div className="absolute inset-0 flex gap-[1.5vw] px-[1.5vw]">
        {cols.map((col, ci) => (
          <div key={ci} className="relative flex-1 overflow-hidden">
            <div className="absolute left-0 top-0 w-full" style={{ animation: `wall-fall ${42 + ci * 7}s linear infinite` }}>
              {[0, 1].map((copy) => (
                <div key={copy}>
                  {col.map((src, i) => (
                    <Tile key={`${copy}-${i}`} src={src} tilt={((i + ci) % 5) - 2} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(13,20,42,0.55) 0%, rgba(13,20,42,0.15) 60%, transparent 100%)" }} />
      <div
        className="absolute left-[2.5vw] top-[2.5vh] flex items-center gap-[1.2vw] rounded-[0.8vw]"
        style={{ background: BG, border: `0.18vw solid ${ACCENT}`, padding: "1.4vh 1.6vw", boxShadow: "0 0.6vw 1.8vw rgba(13,20,42,0.45)" }}
      >
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "12vw" }} />
        <div>
          <div className="font-display font-bold text-white" style={{ fontSize: "2.2vw", lineHeight: 1 }}>AI Helped Me…</div>
          <div className="text-white/80" style={{ fontSize: "1vw" }}>June 9, 2026 · share yours at the photo wall</div>
        </div>
      </div>
      {story && (
        <div className="absolute left-1/2 top-1/2 w-[60vw] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="rounded-[1vw] px-[3vw] py-[3vh] shadow-2xl" style={{ background: "rgba(13,20,42,0.86)", border: `0.2vw solid ${ACCENT}` }}>
            <div className="font-display font-bold text-white" style={{ fontSize: "2.6vw", lineHeight: 1.15 }}>
              <span style={{ color: ACCENT }}>“</span>{story.text}<span style={{ color: ACCENT }}>”</span>
            </div>
            {story.name && story.name !== "Sample" && (
              <div className="mt-[1.5vh] text-white/70" style={{ fontSize: "1.2vw" }}>— {story.name}</div>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-[2vh] right-[2.5vw] text-white/60" style={{ fontSize: "0.9vw" }}>
        {images.length} moments{live ? "" : " · sample mode"}
      </div>
    </div>
  );
}

/** Full-screen cycle through the session posters (16:9), one at a time. */
function PosterCycleView({ schedule }: { schedule: Schedule }) {
  const entries = useMemo(() => posterEntriesFromSchedule(schedule), [schedule]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (entries.length === 0) return;
    const id = setInterval(() => setI((n) => (n + 1) % entries.length), POSTER_EACH_MS);
    return () => clearInterval(id);
  }, [entries.length]);

  if (entries.length === 0) return null;
  const e = entries[i % entries.length];
  const style = defaultSessionStyle(e.session.track);
  const variant = getVariant(style.variantId);
  const data = sessionToPoster(e.session, style.site, e.time);

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: INK }}>
      <div style={{ width: "min(100vw, calc(100vh * 16 / 9))" }}>
        <Poster
          data={data}
          variant={variant}
          format="wide"
          slots={style.slots}
          ringStyle={style.ringStyle}
          topStyle={style.topStyle}
          ringSize={style.ringSize}
          topSize={style.topSize}
          topOpacity={style.topOpacity}
          topFlip={style.topFlip}
          portraitSize={style.portraitSize}
          headshotBg={style.headshotBg}
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
    </div>
  );
}

export function Wall({ schedule }: { schedule: Schedule }) {
  const [images, setImages] = useState<string[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [live, setLive] = useState(false);
  const [view, setView] = useState<"wall" | "posters">("wall");

  // Poll the feed; merge new images so the wall builds up through the day.
  useEffect(() => {
    let active = true;
    async function pull() {
      try {
        const res = await fetch("/api/wall", { cache: "no-store" });
        const body = await res.json();
        if (!active) return;
        setImages((prev) => {
          const seen = new Set(prev);
          const added = (body.images as string[]).filter((u) => !seen.has(u));
          return added.length ? [...prev, ...added] : prev;
        });
        setStories(body.stories ?? []);
        setLive(Boolean(body.live?.images));
      } catch {
        /* keep what we have */
      }
    }
    pull();
    const id = setInterval(pull, 8000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Alternate between the waterfall and the cycling posters.
  useEffect(() => {
    const dwell = view === "wall" ? WALL_MS : POSTERS_MS;
    const t = setTimeout(() => setView((v) => (v === "wall" ? "posters" : "wall")), dwell);
    return () => clearTimeout(t);
  }, [view]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: INK }}>
      {view === "wall" ? (
        <WaterfallView images={images} stories={stories} live={live} />
      ) : (
        <PosterCycleView schedule={schedule} />
      )}
    </div>
  );
}
