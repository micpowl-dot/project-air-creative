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
} from "@/lib/poster";
import { AiDayLogo } from "./AiDayLogo";

// 1920x1080 design space. Sizes/positions are expressed against it; the board
// scales to any width via container-query units (1cqw = 1% of poster width).
const BASE_W = 1920;
const c = (px: number) => `${((px / BASE_W) * 100).toFixed(3)}cqw`;
const pctX = (px: number) => `${((px / BASE_W) * 100).toFixed(3)}%`;
const pctY = (px: number) => `${((px / 1080) * 100).toFixed(3)}%`;

/** Headshot in a rounded square (the portrait slot), with initials fallback. */
function PortraitSlot({ name, ink }: { name: string; ink: string }) {
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
      style={{ borderRadius: c(24), background: "rgba(255,255,255,0.94)" }}
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
            fontSize: c(150),
          }}
        >
          {r.initials}
        </span>
      )}
    </div>
  );
}

export function Poster({
  data,
  variant,
  slots = DEFAULT_SLOTS,
  ringStyle = DEFAULT_RING_STYLE,
  topStyle = DEFAULT_TOP_STYLE,
}: {
  data: PosterData;
  variant: PosterVariant;
  slots?: PosterSlots;
  ringStyle?: RingStyle;
  topStyle?: TopStyle;
}) {
  const mono = "var(--font-poster-mono)";
  const display = "var(--font-poster-display)";
  return (
    <div
      style={{ containerType: "inline-size" }}
      className="relative w-full"
      aria-label={`Poster for ${data.name}`}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16 / 9", background: variant.bg, color: variant.ink }}
      >
        {/* Decorative layers — real element art from /public/poster-elements */}
        {slots.eventMark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/poster-elements/top-edge/${topStyle}.png`}
            alt=""
            className="absolute object-cover"
            style={{ left: pctX(901), top: 0, width: pctX(1019), height: pctY(300) }}
          />
        )}

        {/* bottom-left pattern */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-elements/bottom-left/quarter-circles.png"
          alt=""
          className="absolute object-contain object-left-bottom"
          style={{ left: 0, bottom: 0, width: pctX(986), height: pctY(365), opacity: 0.9 }}
        />

        {/* mid squiggle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-elements/mid/squiggle.png"
          alt=""
          className="absolute object-contain"
          style={{ left: pctX(-120), top: pctY(905), width: pctX(1100), height: pctY(240) }}
        />

        {/* center ring badge */}
        {slots.ringBadge && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/poster-elements/center/${ringStyle}.png`}
            alt=""
            className="absolute object-contain"
            style={{ left: pctX(910), top: pctY(158), width: pctX(875), height: pctY(875) }}
          />
        )}

        {/* Date */}
        {slots.date && (
          <div
            className="absolute"
            style={{
              left: pctX(114),
              top: pctY(40),
              fontFamily: mono,
              fontWeight: 500,
              fontSize: c(46),
              color: variant.light,
              letterSpacing: c(2),
            }}
          >
            {data.dateLabel}
          </div>
        )}

        {/* Portrait over the ring badge */}
        {slots.portrait && (
          <div
            className="absolute"
            style={{
              left: pctX(1106),
              top: pctY(354),
              width: pctX(482),
              height: pctY(482),
            }}
          >
            <PortraitSlot name={data.name} ink={variant.ink} />
          </div>
        )}

        {/* Speaker stack: accent bar + name / session title / tag / info */}
        <div
          className="absolute flex"
          style={{ left: pctX(50), top: pctY(150), width: pctX(820), gap: c(20) }}
        >
          <div style={{ width: c(8), background: variant.accent, alignSelf: "stretch" }} />
          <div className="flex flex-col" style={{ gap: c(14) }}>
            {slots.name && (
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: c(120),
                  lineHeight: 0.92,
                  color: variant.ink,
                }}
              >
                {data.name}
              </div>
            )}
            {slots.role && data.role && (
              <div style={{ fontFamily: display, fontSize: c(46), color: variant.ink }}>
                {data.role}
              </div>
            )}
            {slots.sessionTitle && (
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: c(58),
                  color: variant.ink,
                }}
              >
                {data.sessionTitle}
              </div>
            )}
            {slots.tag && (
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: c(50),
                  color: variant.accent,
                }}
              >
                {data.tag}
              </div>
            )}
            {(slots.location || slots.room || slots.time) && (
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: c(36),
                  color: variant.light,
                  marginTop: c(8),
                  letterSpacing: c(1),
                }}
              >
                {[
                  slots.location && data.location && `📍 ${data.location}`,
                  slots.room && data.room && `ROOM ${data.room}`,
                  slots.time && data.time && data.time,
                ]
                  .filter(Boolean)
                  .join("   ·   ")}
              </div>
            )}
          </div>
        </div>

        {/* AI DAY logo — placed where the "air" lockup was (bottom-right).
            Its yellow follows the active scheme accent. */}
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
