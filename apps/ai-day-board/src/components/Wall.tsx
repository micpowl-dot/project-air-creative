"use client";

import { useEffect, useMemo, useState } from "react";
import { AiDayLogo } from "./AiDayLogo";

interface Story {
  name: string;
  text: string;
}

const COLUMNS = 5;
// magenta scheme (matches the board/posters)
const BG = "#FB00FF";
const ACCENT = "#FFE500";
const INK = "#0D142A";

/** A single framed "photo" tile (polaroid-ish white frame, slight tilt). */
function Tile({ src, tilt }: { src: string; tilt: number }) {
  return (
    <div
      className="mb-[3vh] inline-block rounded-[0.4vw] bg-white p-[0.6vw] shadow-2xl"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="overflow-hidden rounded-[0.2vw]" style={{ width: "100%", aspectRatio: "1 / 1", background: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

export function Wall() {
  const [images, setImages] = useState<string[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [storyIdx, setStoryIdx] = useState(0);
  const [live, setLive] = useState(false);

  // Poll the feed; merge in any new images (dedupe), so the wall builds up.
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
        setLive(Boolean(body.live));
      } catch {
        /* keep what we have */
      }
    }
    pull();
    const id = setInterval(pull, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Rotate the featured story every ~20s.
  useEffect(() => {
    if (stories.length === 0) return;
    const id = setInterval(() => setStoryIdx((i) => (i + 1) % stories.length), 20000);
    return () => clearInterval(id);
  }, [stories.length]);

  // Distribute images round-robin into columns.
  const cols = useMemo(() => {
    const out: string[][] = Array.from({ length: COLUMNS }, () => []);
    images.forEach((src, i) => out[i % COLUMNS].push(src));
    return out;
  }, [images]);

  const story = stories[storyIdx];

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: BG }}>
      <style>{`@keyframes wall-fall { from { transform: translateY(-50%); } to { transform: translateY(0); } }`}</style>

      {/* Falling columns */}
      <div className="absolute inset-0 flex gap-[1.5vw] px-[1.5vw]">
        {cols.map((col, ci) => (
          <div key={ci} className="relative flex-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 w-full"
              style={{ animation: `wall-fall ${42 + ci * 7}s linear infinite` }}
            >
              {/* two copies for a seamless loop */}
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

      {/* subtle darkening so foreground text reads */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(13,20,42,0.55) 0%, rgba(13,20,42,0.15) 60%, transparent 100%)" }} />

      {/* Header lockup */}
      <div className="absolute left-[2.5vw] top-[2.5vh] flex items-center gap-[1.2vw]">
        <AiDayLogo accent={ACCENT} ink={INK} light="#fff" style={{ width: "12vw" }} />
        <div>
          <div className="font-display font-bold text-white" style={{ fontSize: "2.2vw", lineHeight: 1 }}>AI Helped Me…</div>
          <div className="text-white/80" style={{ fontSize: "1vw" }}>June 9, 2026 · share yours at the photo wall</div>
        </div>
      </div>

      {/* Featured story */}
      {story && (
        <div className="absolute left-1/2 top-1/2 w-[60vw] -translate-x-1/2 -translate-y-1/2 text-center">
          <div
            className="rounded-[1vw] px-[3vw] py-[3vh] shadow-2xl"
            style={{ background: "rgba(13,20,42,0.86)", border: `0.2vw solid ${ACCENT}` }}
          >
            <div className="font-display font-bold text-white" style={{ fontSize: "2.6vw", lineHeight: 1.15 }}>
              <span style={{ color: ACCENT }}>“</span>{story.text}<span style={{ color: ACCENT }}>”</span>
            </div>
            {story.name && story.name !== "Sample" && (
              <div className="mt-[1.5vh] text-white/70" style={{ fontSize: "1.2vw" }}>— {story.name}</div>
            )}
          </div>
        </div>
      )}

      {/* footer status */}
      <div className="absolute bottom-[2vh] right-[2.5vw] text-white/60" style={{ fontSize: "0.9vw" }}>
        {images.length} moments{live ? "" : " · sample mode"}
      </div>
    </div>
  );
}
