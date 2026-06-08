"use client";

import { useEffect, useMemo, useState } from "react";
import { AiDayLogo } from "./AiDayLogo";
import { Poster } from "./Poster";
import type { Schedule } from "@/lib/types";
import {
  posterEntriesFromSchedule,
  sessionToPoster,
  defaultSessionStyleFor,
  getVariant,
  HEADSHOT_BACKGROUNDS,
} from "@/lib/poster";

interface Story {
  name: string;
  text: string;
}
interface WallImage {
  src: string;
  handle?: string;
}

const COLUMNS = 5;
const BG = "#FB00FF";
const ACCENT = "#FFE500";
const INK = "#0D142A";

// How long each view stays on screen before alternating.
const WALL_MS = 42000;
const POSTERS_MS = 28000;
const INSTRUCTIONS_MS = 16000; // "how to join" slide between waterfall and posters
const POSTER_EACH_MS = 7000; // per-poster within the poster cycle

// Rotation order for the wall. Add/remove views here to change the loop.
const VIEW_ORDER = ["wall", "instructions", "posters"] as const;
type View = (typeof VIEW_ORDER)[number];

// "How to join" steps, mirrored from the /snap/instructions phone page but laid
// out for a 16:9 screen. Kept in sync by hand — it's a tiny list.
const STEPS = [
  { n: "1", icon: "📱", title: "Scan the QR code", body: "Point your phone camera at the code. It opens instantly, no app to download." },
  { n: "2", icon: "📸", title: "Take a selfie", body: "Tap for a live selfie, or upload a photo from your library." },
  { n: "3", icon: "✍️", title: "Add your @handle", body: "Type your Slack handle so everyone knows it's you. Optional." },
  { n: "4", icon: "✨", title: "Hit “AI Day Me”", body: "Your photo gets illustrated in the AI Day style and lands on this wall." },
];
const SNAP_URL = "ai-day-board.vercel.weather.com/snap";

// Deterministic random palette backdrop per tile (stable across re-renders and
// the duplicated loop copy). Shows through transparent cutouts; real photos
// just cover it.
function bgForSrc(src: string): string {
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  const id = HEADSHOT_BACKGROUNDS[h % HEADSHOT_BACKGROUNDS.length].id;
  return `/headshots/bg/${id}.png`;
}

function Tile({ item, tilt }: { item: WallImage; tilt: number }) {
  const bg = bgForSrc(item.src);
  return (
    <div className="mb-[3vh] block w-full rounded-[0.4vw] bg-white p-[0.6vw] shadow-2xl" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="relative w-full overflow-hidden rounded-[0.2vw]" style={{ aspectRatio: "1 / 1", background: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {item.handle && (
          <div className="absolute bottom-0 left-0 right-0" style={{ background: "rgba(13,20,42,0.72)", padding: "0.35vw 0.6vw" }}>
            <span className="font-display font-bold" style={{ color: ACCENT, fontSize: "0.95vw" }}>{item.handle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** The waterfall of photobooth photos + a rotating "AI helped me..." card. */
function WaterfallView({ images, stories, live }: { images: WallImage[]; stories: Story[]; live: boolean }) {
  const [storyIdx, setStoryIdx] = useState(0);
  useEffect(() => {
    if (stories.length === 0) return;
    const id = setInterval(() => setStoryIdx((i) => (i + 1) % stories.length), 20000);
    return () => clearInterval(id);
  }, [stories.length]);

  const cols = useMemo(() => {
    const out: WallImage[][] = Array.from({ length: COLUMNS }, () => []);
    images.forEach((img, i) => out[i % COLUMNS].push(img));
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
                  {col.map((img, i) => (
                    <Tile key={`${copy}-${i}`} item={img} tilt={((i + ci) % 5) - 2} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(13,20,42,0.55) 0%, rgba(13,20,42,0.15) 60%, transparent 100%)" }} />
      <div
        className="absolute left-[2.5vw] top-[2.5vh] flex items-center gap-[1.2vw]"
        style={{ background: BG, padding: "calc(1.4vh + 20px) calc(1.6vw + 20px)", boxShadow: "0 0.6vw 1.8vw rgba(13,20,42,0.45)" }}
      >
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "12vw" }} />
        <div>
          <div className="font-display font-bold text-white" style={{ fontSize: "2.2vw", lineHeight: 1 }}>AI Helped Me…</div>
          <div className="text-white/80" style={{ fontSize: "1vw" }}>June 9, 2026 · share yours at the photo wall</div>
        </div>
      </div>
      {story && (
        <div className="absolute left-1/2 top-1/2 w-[60vw] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="px-[3vw] py-[3vh] shadow-2xl" style={{ background: "rgba(13,20,42,0.86)" }}>
            <div className="font-display font-bold text-white" style={{ fontSize: "2.6vw", lineHeight: 1.15 }}>
              <span style={{ color: ACCENT }}>“</span>{story.text}<span style={{ color: ACCENT }}>”</span>
            </div>
            {story.name && (
              <div className="mt-[1.5vh] font-display font-bold" style={{ fontSize: "1.5vw", color: ACCENT }}>— {story.name}</div>
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
  const style = defaultSessionStyleFor(e.session);
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

/** Full-screen 16:9 "how to get on the wall" slide. */
function InstructionsView() {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=https://${SNAP_URL}&color=0D142A`;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: BG }}>
      {/* header */}
      <div className="flex items-center gap-[1.6vw] px-[4vw] pt-[5vh]">
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "13vw" }} />
        <div>
          <div className="font-display font-bold text-white" style={{ fontSize: "3vw", lineHeight: 1.05 }}>
            Get your AI portrait on the wall <span style={{ color: ACCENT }}>🎨</span>
          </div>
          <div className="text-white/85" style={{ fontSize: "1.25vw", marginTop: "1.2vh" }}>
            Snap a selfie and watch yourself appear as an illustrated AI Day portrait.
          </div>
        </div>
      </div>

      {/* body: steps on the left, QR on the right */}
      <div className="flex flex-1 items-center gap-[3.5vw] px-[4vw] py-[4vh]">
        <div className="grid flex-1 grid-cols-2 gap-[1.8vw]">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex items-start gap-[1.2vw] rounded-[0.8vw]"
              style={{ background: "rgba(13,20,42,0.55)", padding: "1.8vh 1.6vw" }}
            >
              <div
                className="flex items-center justify-center rounded-full font-display font-bold"
                style={{ width: "3.2vw", height: "3.2vw", minWidth: "3.2vw", background: ACCENT, color: INK, fontSize: "1.5vw" }}
              >
                {s.n}
              </div>
              <div>
                <div className="font-display font-bold text-white" style={{ fontSize: "1.5vw", marginBottom: "0.5vh" }}>
                  {s.icon} {s.title}
                </div>
                <div className="text-white/75" style={{ fontSize: "1.05vw", lineHeight: 1.4 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* QR card */}
        <div
          className="flex flex-col items-center text-center rounded-[1vw]"
          style={{ background: "rgba(13,20,42,0.55)", padding: "3.5vh 2.5vw" }}
        >
          <div className="font-display font-bold text-white" style={{ fontSize: "1.7vw", marginBottom: "2vh" }}>
            📱 Scan to get started
          </div>
          <div className="rounded-[0.8vw] bg-white" style={{ padding: "1.4vw" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to the photo station" style={{ width: "16vw", height: "16vw", imageRendering: "pixelated" }} />
          </div>
          <div className="font-display font-bold" style={{ color: ACCENT, fontSize: "1.1vw", marginTop: "2vh" }}>{SNAP_URL}</div>
          <div className="text-white/70" style={{ fontSize: "0.95vw", marginTop: "1vh", maxWidth: "22vw" }}>
            Works on any phone. Takes about 30 seconds.
          </div>
        </div>
      </div>

      <div className="absolute bottom-[2vh] right-[2.5vw] text-white/60" style={{ fontSize: "0.9vw" }}>
        AI Day · June 9, 2026 · The Weather Company
      </div>
    </div>
  );
}

export function Wall({ schedule }: { schedule: Schedule }) {
  const [images, setImages] = useState<WallImage[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [live, setLive] = useState(false);
  const [view, setView] = useState<View>("wall");

  // Poll the feed; merge new images so the wall builds up through the day.
  useEffect(() => {
    let active = true;
    async function pull() {
      try {
        const res = await fetch("/api/wall", { cache: "no-store" });
        const body = await res.json();
        if (!active) return;
        setImages((prev) => {
          const seen = new Set(prev.map((p) => p.src));
          const added = (body.images as WallImage[]).filter((it) => it?.src && !seen.has(it.src));
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

  // Cycle through the views in VIEW_ORDER: waterfall → how-to-join → posters → …
  useEffect(() => {
    const dwell = view === "wall" ? WALL_MS : view === "posters" ? POSTERS_MS : INSTRUCTIONS_MS;
    const t = setTimeout(
      () => setView((v) => VIEW_ORDER[(VIEW_ORDER.indexOf(v) + 1) % VIEW_ORDER.length]),
      dwell,
    );
    return () => clearTimeout(t);
  }, [view]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: INK }}>
      {view === "wall" && <WaterfallView images={images} stories={stories} live={live} />}
      {view === "instructions" && <InstructionsView />}
      {view === "posters" && <PosterCycleView schedule={schedule} />}
    </div>
  );
}
