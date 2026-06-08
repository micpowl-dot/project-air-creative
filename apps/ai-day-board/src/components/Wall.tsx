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
const BLUE = "#0062FF";
const TEAL = "#67FAE0";

// How long each view stays on screen before alternating.
const WALL_MS = 42000;
const POSTERS_MS = 28000;
const INSTRUCTIONS_MS = 16000; // "how to join" slide between waterfall and posters
const POSTER_EACH_MS = 7000; // per-poster within the poster cycle

// Rotation order for the wall. Add/remove views here to change the loop.
const VIEW_ORDER = ["wall", "instructions", "posters"] as const;
type View = (typeof VIEW_ORDER)[number];

// Two ways to join, mirrored from the /snap/instructions sign but laid out for
// a 16:9 screen. Kept in sync by hand — tiny lists.
type Step = { n: string; icon: IconName; title: string; body: string };
const SNAP_STEPS: Step[] = [
  { n: "1", icon: "scan", title: "Scan the QR code", body: "Point your phone camera at the code. It opens instantly, no app to download." },
  { n: "2", icon: "camera", title: "Pick your name, then snap", body: "Choose your name, then take a live selfie or upload a photo." },
  { n: "3", icon: "sparkle", title: "Hit “AI Day Me”", body: "Your photo gets illustrated in the AI Day style and lands on this wall." },
];
const QUOTE_STEPS: Step[] = [
  { n: "1", icon: "hash", title: "Open #twco_ai_practice", body: "Find the channel in Slack. It's where everyone's sharing AI wins today." },
  { n: "2", icon: "edit", title: "Start with “AI helped me…”", body: "Finish the thought in one sentence. Keep it under 240 characters." },
  { n: "3", icon: "monitor", title: "Watch the wall", body: "Your words appear here within about a minute, with your name." },
];
const SNAP_URL = "ai-day-board.vercel.weather.com/snap";

// Deterministic ticker-tape confetti for the join slide (no Math.random, so
// server/client markup match). Each piece falls (outer span) and flips fast in
// 3D (inner). Sized up for a big wall screen.
const WALL_CONFETTI_COLORS = ["#FFE500", "#67FAE0", "#ffffff", "#0D142A"];
const WALL_CONFETTI = Array.from({ length: 70 }, (_, i) => {
  const dir = i % 2 ? 1 : -1;
  return {
    left: (i * 7.3 + (i % 6) * 4.1) % 100,
    fallDelay: ((i * 41) % 140) / 10,
    fallDur: 5.5 + ((i * 23) % 85) / 10,
    w: 4 + (i % 5) * 2,
    h: 8 + (i % 6) * 3,
    color: WALL_CONFETTI_COLORS[i % WALL_CONFETTI_COLORS.length],
    sway: dir * (16 + (i % 7) * 22),
    op: 0.7 + (i % 3) * 0.1,
    flipDur: 0.35 + ((i * 13) % 12) / 10,
    flipDelay: ((i * 7) % 9) / 10,
    rx: (i % 2 ? 1 : -1) * (1 + (i % 3)),
    ry: (i % 3 ? -1 : 1) * (1 + (i % 2)),
    rz: dir * (0.5 + (i % 3) * 0.5),
  };
});

// Inline line-icons (stroke = currentColor) so the slide carries no emoji,
// which render inconsistently on smart-TV browsers.
type IconName = "scan" | "camera" | "at" | "sparkle" | "hash" | "edit" | "monitor" | "message";
function Icon({ name, style }: { name: IconName; style?: React.CSSProperties }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    "aria-hidden": true,
  };
  switch (name) {
    case "scan":
      return (
        <svg {...common}>
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      );
    case "at":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 2.5l2.2 6.8L21 11.5l-6.8 2.2L12 20.5l-2.2-6.8L3 11.5l6.8-2.2z" />
          <path d="M19 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
        </svg>
      );
    case "hash":
      return (
        <svg {...common}>
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
      );
  }
}

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
        style={{ background: "rgba(251, 0, 255, 0.72)", backdropFilter: "blur(1.5px)", WebkitBackdropFilter: "blur(1.5px)", padding: "calc(1.4vh + 20px) calc(1.6vw + 20px)", boxShadow: "0 0.6vw 1.8vw rgba(13,20,42,0.45)" }}
      >
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "12vw" }} />
        <div>
          <div className="font-display font-bold text-white" style={{ fontSize: "2.2vw", lineHeight: 1, textShadow: "0 0.12vw 0.5vw rgba(13,20,42,0.55)" }}>AI Helped Me…</div>
          <div className="text-white" style={{ fontSize: "1vw", textShadow: "0 0.1vw 0.4vw rgba(13,20,42,0.6)", opacity: 0.9 }}>June 9, 2026 · share yours at the photo wall</div>
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

/** Full-page ticker-tape confetti, behind the join-slide content. */
function JoinConfetti() {
  return (
    <div className="wall-confetti" aria-hidden="true">
      <style>{`
        .wall-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; perspective: 900px; }
        .wall-confetti .cf { position: absolute; top: 0; opacity: 0; will-change: transform, opacity; transform-style: preserve-3d; animation-name: wall-cf-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
        .wall-confetti .cf i { display: block; border-radius: 1px; will-change: transform; animation-name: wall-cf-flip; animation-timing-function: linear; animation-iteration-count: infinite; }
        @keyframes wall-cf-fall { 0% { transform: translate3d(0,-20vh,0); opacity: var(--op,0.8); } 90% { opacity: var(--op,0.8); } 100% { transform: translate3d(var(--sway,0),120vh,0); opacity: 0; } }
        @keyframes wall-cf-flip { to { transform: rotateX(var(--rx,1turn)) rotateY(var(--ry,1turn)) rotateZ(var(--rz,0.5turn)); } }
        @media (prefers-reduced-motion: reduce) { .wall-confetti { display: none; } }
      `}</style>
      {WALL_CONFETTI.map((c, i) => (
        <span
          key={i}
          className="cf"
          style={{ left: `${c.left}%`, animationDuration: `${c.fallDur}s`, animationDelay: `${c.fallDelay}s`, ["--sway"]: `${c.sway}px`, ["--op"]: `${c.op}` } as React.CSSProperties}
        >
          <i
            style={{ width: `${c.w}px`, height: `${c.h}px`, background: c.color, animationDuration: `${c.flipDur}s`, animationDelay: `${c.flipDelay}s`, ["--rx"]: `${c.rx}turn`, ["--ry"]: `${c.ry}turn`, ["--rz"]: `${c.rz}turn` } as React.CSSProperties}
          />
        </span>
      ))}
    </div>
  );
}

/** One numbered step row on the join slide. */
function StepRow({ s, accent, card }: { s: Step; accent: string; card: string }) {
  return (
    <div className="flex items-center gap-[1vw] rounded-[0.8vw]" style={{ background: card, padding: "1.3vh 1.2vw" }}>
      <div
        className="flex items-center justify-center rounded-full font-display font-bold"
        style={{ width: "2.6vw", height: "2.6vw", minWidth: "2.6vw", background: accent, color: INK, fontSize: "1.3vw" }}
      >
        {s.n}
      </div>
      <div>
        <div className="flex items-center gap-[0.5vw] font-display font-bold text-white" style={{ fontSize: "1.3vw", marginBottom: "0.3vh" }}>
          <Icon name={s.icon} style={{ width: "1.3vw", height: "1.3vw", color: accent, flex: "none" }} />
          {s.title}
        </div>
        <div className="text-white/75" style={{ fontSize: "0.95vw", lineHeight: 1.35 }}>{s.body}</div>
      </div>
    </div>
  );
}

/** Full-screen 16:9 "two ways to join" slide — magenta Snap / blue Quote. */
function InstructionsView() {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=https://${SNAP_URL}&color=0D142A`;
  const card = "rgba(13,20,42,0.5)";
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: `linear-gradient(90deg, ${BG} 0 50%, ${BLUE} 50% 100%)` }}
    >
      <JoinConfetti />

      {/* masthead */}
      <div className="relative flex flex-col items-center text-center" style={{ zIndex: 2, paddingTop: "4vh", paddingBottom: "1vh", gap: "0.8vh" }}>
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "13vw" }} />
        <div className="flex items-center gap-[0.8vw] font-display font-bold text-white" style={{ fontSize: "2.4vw", lineHeight: 1.05 }}>
          Two ways to land on the AI Day wall
          <Icon name="sparkle" style={{ width: "2.2vw", height: "2.2vw", color: ACCENT, flex: "none" }} />
        </div>
        <div className="text-white/85" style={{ fontSize: "1.1vw" }}>Snap a portrait, share a win, or do both.</div>
      </div>

      {/* split body */}
      <div className="relative grid flex-1" style={{ zIndex: 2, gridTemplateColumns: "1fr 1fr" }}>
        {/* LEFT — Snap (magenta / yellow) */}
        <div className="flex flex-col" style={{ padding: "2vh 3vw 3vh" }}>
          <div className="flex items-center gap-[0.7vw] font-display font-bold text-white" style={{ fontSize: "1.9vw" }}>
            <Icon name="camera" style={{ width: "1.9vw", height: "1.9vw", color: ACCENT, flex: "none" }} />
            Get your portrait up
          </div>
          <div className="text-white/80" style={{ fontSize: "1.05vw", margin: "0.6vh 0 2vh" }}>
            Take a selfie and watch yourself appear as an illustrated AI Day portrait.
          </div>
          <div className="flex items-start gap-[2vw]">
            {/* QR */}
            <div className="flex flex-col items-center text-center rounded-[1vw]" style={{ background: card, padding: "2vh 1.4vw" }}>
              <div className="rounded-[0.6vw] bg-white" style={{ padding: "0.9vw" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code to the photo station" style={{ width: "11vw", height: "11vw", imageRendering: "pixelated" }} />
              </div>
              <div className="font-display font-bold" style={{ color: ACCENT, fontSize: "0.8vw", marginTop: "1vh" }}>{SNAP_URL}</div>
            </div>
            {/* steps */}
            <div className="flex flex-1 flex-col gap-[1.2vh]">
              {SNAP_STEPS.map((s) => (
                <StepRow key={s.n} s={s} accent={ACCENT} card={card} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Quote (blue / teal) */}
        <div className="flex flex-col" style={{ padding: "2vh 3vw 3vh" }}>
          <div className="flex items-center gap-[0.7vw] font-display font-bold text-white" style={{ fontSize: "1.9vw" }}>
            <Icon name="message" style={{ width: "1.9vw", height: "1.9vw", color: TEAL, flex: "none" }} />
            Get your words up
          </div>
          <div className="text-white/80" style={{ fontSize: "1.05vw", margin: "0.6vh 0 2vh" }}>
            Tell us what AI helped you do. Your quote runs on the wall right alongside the portraits.
          </div>
          <div className="flex flex-col gap-[1.2vh]">
            {QUOTE_STEPS.map((s) => (
              <StepRow key={s.n} s={s} accent={TEAL} card={card} />
            ))}
          </div>
          <div className="rounded-[0.8vw]" style={{ background: card, padding: "1.6vh 1.4vw", marginTop: "1.4vh" }}>
            <div className="text-white/55" style={{ fontSize: "0.72vw", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.8vh" }}>For example</div>
            <div className="italic text-white" style={{ fontSize: "1vw", lineHeight: 1.35 }}>
              <span style={{ color: TEAL, fontStyle: "normal", fontWeight: 700 }}>“</span>AI helped me turn a messy spreadsheet into a clean report in ten minutes.<span style={{ color: TEAL, fontStyle: "normal", fontWeight: 700 }}>”</span>
            </div>
            <div style={{ fontSize: "0.9vw", marginTop: "1vh", color: "rgba(255,255,255,0.7)" }}>
              Post in{" "}
              <span className="font-display font-bold" style={{ background: TEAL, color: INK, padding: "0.1vh 0.5vw", borderRadius: "0.3vw" }}>#twco_ai_practice</span>{" "}
              on Slack.
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[2vh] right-[2.5vw] text-white/60" style={{ fontSize: "0.9vw", zIndex: 2 }}>
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

  // Optional ?view= override so a specific slide can be previewed/QA'd directly
  // (e.g. /wall?view=instructions). Applied after mount to avoid a hydration
  // mismatch — server and client both start on "wall".
  useEffect(() => {
    const v = window.location.search.match(/[?&]view=([^&]+)/)?.[1];
    if (v && (VIEW_ORDER as readonly string[]).includes(v)) setView(v as View);
  }, []);

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
