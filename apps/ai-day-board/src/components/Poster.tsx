"use client";

import { useEffect, useRef, useState } from "react";
import { resolveHeadshot } from "@/data/headshots";
import {
  type PosterData,
  type PosterSlots,
  type PosterVariant,
  type RingStyle,
  type TopStyle,
  DEFAULT_SLOTS,
  DEFAULT_RING_STYLE,
  DEFAULT_TOP_STYLE,
  RING_SIZE,
  TOP_SIZE,
  PORTRAIT_SIZE,
  SQUIGGLE_SIZE,
} from "@/lib/poster";
import { AiDayLogo } from "./AiDayLogo";

// 1920x1080 design space. Sizes/positions are expressed against it; the board
// scales to any width via container-query units (1cqw = 1% of poster width).
const BASE_W = 1920;
const BASE_H = 1080;
const c = (px: number) => `${((px / BASE_W) * 100).toFixed(3)}cqw`;
const pctX = (px: number) => `${((px / BASE_W) * 100).toFixed(3)}%`;
const pctY = (px: number) => `${((px / BASE_H) * 100).toFixed(3)}%`;

// Ring badge center (so size changes scale around the portrait).
const RING_CENTER = { x: 1347.5, y: 595.5 };
const RING_BASE = 875;

/** One square headshot with initials fallback (no rounded corners). */
function HeadshotSquare({ name, ink }: { name: string; ink: string }) {
  const r = resolveHeadshot(name);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setErrored(true);
  }, [r.src]);
  const showImg = r.src && !errored;
  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: "rgba(255,255,255,0.94)" }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={r.src!}
          alt={name}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          style={{
            color: ink,
            fontFamily: "var(--font-poster-display)",
            fontWeight: 800,
            fontSize: c(140),
          }}
        >
          {r.initials}
        </span>
      )}
    </div>
  );
}

/** 1–3 headshots laid out as squares, centered on the ring badge.
 *  The whole group (squares + the gap between them) scales as a unit. */
function PortraitGroup({ names, ink, scale }: { names: string[]; ink: string; scale: number }) {
  const list = names.slice(0, 3);
  const n = Math.max(1, list.length);
  // base square size + gap per count, then scaled together as a unit
  const base = n === 1 ? { size: 482, gap: 0 } : n === 2 ? { size: 360, gap: 28 } : { size: 300, gap: 20 };
  const cfg = { size: base.size * scale, gap: base.gap * scale };
  const totalW = cfg.size * n + cfg.gap * (n - 1);
  const left = RING_CENTER.x - totalW / 2;
  const top = RING_CENTER.y - cfg.size / 2;
  return (
    <div
      className="absolute flex"
      style={{ left: pctX(left), top: pctY(top), gap: c(cfg.gap) }}
    >
      {list.map((person, i) => (
        <div key={person + i} style={{ width: c(cfg.size), height: c(cfg.size) }}>
          <HeadshotSquare name={person} ink={ink} />
        </div>
      ))}
    </div>
  );
}

export function Poster({
  data,
  variant,
  slots = DEFAULT_SLOTS,
  ringStyle = DEFAULT_RING_STYLE,
  topStyle = DEFAULT_TOP_STYLE,
  ringSize = RING_SIZE.default,
  topSize = TOP_SIZE.default,
  portraitSize = PORTRAIT_SIZE.default,
  topOffsetX = 0,
  topOffsetY = 0,
  bottomOffsetX = 0,
  bottomOffsetY = 0,
  squiggleSize = SQUIGGLE_SIZE.default,
  squiggleOffsetX = 0,
  squiggleOffsetY = 0,
}: {
  data: PosterData;
  variant: PosterVariant;
  slots?: PosterSlots;
  ringStyle?: RingStyle;
  topStyle?: TopStyle;
  ringSize?: number;
  topSize?: number;
  portraitSize?: number;
  topOffsetX?: number;
  topOffsetY?: number;
  bottomOffsetX?: number;
  bottomOffsetY?: number;
  squiggleSize?: number;
  squiggleOffsetX?: number;
  squiggleOffsetY?: number;
}) {
  const mono = "var(--font-poster-mono)";
  const display = "var(--font-poster-display)";

  const ringPx = RING_BASE * ringSize;
  const ringLeft = RING_CENTER.x - ringPx / 2;
  const ringTop = RING_CENTER.y - ringPx / 2;

  return (
    <div style={{ containerType: "inline-size" }} className="relative w-full" aria-label={`Poster for ${data.name}`}>
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16 / 9", background: variant.bg, color: variant.ink, borderRadius: 0 }}
      >
        {/* Top-edge graphic — anchored to the top-right corner, scalable + cropped */}
        {slots.eventMark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/poster-elements/top-edge/${topStyle}.png`}
            alt=""
            className="absolute object-cover"
            style={{
              right: 0,
              top: 0,
              width: pctX(1019 * topSize),
              height: pctY(300 * topSize),
              objectPosition: "right top",
              transform: `translate(${c(topOffsetX)}, ${c(topOffsetY)})`,
            }}
          />
        )}

        {/* bottom-left pattern */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-elements/bottom-left/quarter-circles.png"
          alt=""
          className="absolute object-contain object-left-bottom"
          style={{
            left: 0,
            bottom: 0,
            width: pctX(986),
            height: pctY(365),
            opacity: 0.9,
            transform: `translate(${c(bottomOffsetX)}, ${c(bottomOffsetY)})`,
          }}
        />

        {/* mid squiggle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-elements/mid/squiggle.png"
          alt=""
          className="absolute object-contain"
          style={{
            left: pctX(-120),
            top: pctY(905),
            width: pctX(1100 * squiggleSize),
            height: pctY(240 * squiggleSize),
            transform: `translate(${c(squiggleOffsetX)}, ${c(squiggleOffsetY)})`,
          }}
        />

        {/* center ring badge — scalable around its center */}
        {slots.ringBadge && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/poster-elements/center/${ringStyle}.png`}
            alt=""
            className="absolute object-contain"
            style={{ left: pctX(ringLeft), top: pctY(ringTop), width: pctX(ringPx), height: pctY(ringPx) }}
          />
        )}

        {/* Date */}
        {slots.date && (
          <div
            className="absolute"
            style={{ left: pctX(114), top: pctY(40), fontFamily: mono, fontWeight: 500, fontSize: c(46), color: variant.light, letterSpacing: c(2) }}
          >
            {data.dateLabel}
          </div>
        )}

        {/* Portrait(s) over the ring badge */}
        {slots.portrait && (
          <PortraitGroup names={data.names.length ? data.names : [data.name]} ink={variant.ink} scale={portraitSize} />
        )}

        {/* Speaker stack */}
        <div className="absolute flex" style={{ left: pctX(50), top: pctY(150), width: pctX(820), gap: c(20) }}>
          <div style={{ width: c(8), background: variant.accent, alignSelf: "stretch" }} />
          <div className="flex flex-col" style={{ gap: c(14) }}>
            {slots.name && (
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: c(120), lineHeight: 0.92, color: variant.ink }}>
                {data.names.length > 1 ? data.names.join(" + ") : data.name}
              </div>
            )}
            {slots.role && data.role && (
              <div style={{ fontFamily: display, fontSize: c(46), color: variant.ink }}>{data.role}</div>
            )}
            {slots.sessionTitle && (
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: c(58), color: variant.ink }}>{data.sessionTitle}</div>
            )}
            {slots.tag && (
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(50), color: variant.accent }}>{data.tag}</div>
            )}
            {(slots.location || slots.room || slots.time) && (
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(36), color: variant.light, marginTop: c(8), letterSpacing: c(1) }}>
                {[
                  slots.location && data.location && data.location,
                  slots.room && data.room && `ROOM ${data.room}`,
                  slots.time && data.time && data.time,
                ]
                  .filter(Boolean)
                  .join("   ·   ")}
              </div>
            )}
          </div>
        </div>

        {/* AI DAY logo bottom-right; yellow follows the scheme accent */}
        {slots.lockup && (
          <AiDayLogo
            accent={variant.accent}
            ink={variant.ink}
            light={variant.light}
            className="absolute"
            style={{ left: pctX(1470), top: pctY(870), width: pctX(390) }}
          />
        )}
      </div>
    </div>
  );
}
