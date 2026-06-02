"use client";

import { useEffect, useRef, useState } from "react";
import { resolveHeadshot } from "@/data/headshots";
import {
  type PosterData,
  type PosterSlots,
  type PosterVariant,
  DEFAULT_SLOTS,
} from "@/lib/poster";

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
      style={{ borderRadius: c(28), background: "rgba(255,255,255,0.92)" }}
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

/** Top-right black/white/accent vertical stripe field. */
function StripeField({ variant }: { variant: PosterVariant }) {
  return (
    <div
      className="absolute"
      style={{
        left: pctX(901),
        top: 0,
        width: pctX(1100),
        height: pctY(300),
        background: `repeating-linear-gradient(90deg, ${variant.ink} 0 ${c(26)}, ${variant.light} ${c(26)} ${c(52)}, ${variant.accent} ${c(52)} ${c(60)}, ${variant.light} ${c(60)} ${c(86)})`,
        maskImage: `repeating-linear-gradient(90deg, #000 0 ${c(26)}, transparent ${c(26)} ${c(30)})`,
        WebkitMaskImage: `repeating-linear-gradient(90deg, #000 0 ${c(26)}, transparent ${c(26)} ${c(30)})`,
      }}
    />
  );
}

/** Concentric quatrefoil-ish ring badge behind the portrait. */
function RingBadge({ variant }: { variant: PosterVariant }) {
  const rings = `repeating-radial-gradient(circle at center, ${variant.ink} 0 ${c(18)}, ${variant.light} ${c(18)} ${c(40)})`;
  return (
    <div
      className="absolute"
      style={{
        left: pctX(910),
        top: pctY(158),
        width: pctX(875),
        height: pctY(875),
      }}
    >
      {/* four overlapping circles -> quatrefoil */}
      {[
        { l: "18%", t: "0%" },
        { l: "18%", t: "36%" },
        { l: "0%", t: "18%" },
        { l: "36%", t: "18%" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.l,
            top: p.t,
            width: "64%",
            height: "64%",
            background: rings,
          }}
        />
      ))}
    </div>
  );
}

/** Faint arc/dot texture, bottom-left, plus an accent squiggle. */
function BottomTexture({ variant }: { variant: PosterVariant }) {
  return (
    <>
      <div
        className="absolute"
        style={{
          left: 0,
          bottom: 0,
          width: pctX(986),
          height: pctY(300),
          opacity: 0.18,
          background: `radial-gradient(circle at 12% 120%, transparent ${c(40)}, ${variant.ink} ${c(40)} ${c(54)}, transparent ${c(54)}), radial-gradient(circle at 42% 120%, transparent ${c(60)}, ${variant.ink} ${c(60)} ${c(78)}, transparent ${c(78)})`,
        }}
      />
      <svg
        className="absolute"
        style={{ left: pctX(140), bottom: pctY(40), width: pctX(620), height: pctY(120) }}
        viewBox="0 0 620 120"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M2 60 C 80 6, 160 6, 230 60 S 400 114, 470 60 S 600 18, 618 60"
          stroke={variant.accent}
          strokeWidth="6"
          fill="none"
        />
      </svg>
    </>
  );
}

/** The "AI DAY" event wordmark — condensed, alternating light/ink/accent. */
function EventMark({ variant }: { variant: PosterVariant }) {
  const letters: { ch: string; color: string }[] = [
    { ch: "A", color: variant.light },
    { ch: "I", color: variant.ink },
    { ch: " ", color: variant.light },
    { ch: "D", color: variant.accent },
    { ch: "A", color: variant.ink },
    { ch: "Y", color: variant.accent },
  ];
  return (
    <div
      className="absolute leading-none"
      style={{
        left: pctX(46),
        top: pctY(120),
        fontFamily: "var(--font-poster-display)",
        fontWeight: 800,
        fontSize: c(300),
        letterSpacing: c(-6),
      }}
    >
      {letters.map((l, i) => (
        <span key={i} style={{ color: l.color }}>
          {l.ch}
        </span>
      ))}
    </div>
  );
}

export function Poster({
  data,
  variant,
  slots = DEFAULT_SLOTS,
}: {
  data: PosterData;
  variant: PosterVariant;
  slots?: PosterSlots;
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
        {/* Decorative layers */}
        {slots.eventMark && <StripeField variant={variant} />}
        {slots.ringBadge && <RingBadge variant={variant} />}
        <BottomTexture variant={variant} />

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

        {/* Event mark */}
        {slots.eventMark && <EventMark variant={variant} />}

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

        {/* Speaker stack: accent bar + name / session title / tag */}
        <div
          className="absolute flex"
          style={{ left: pctX(50), top: pctY(560), width: pctX(800), gap: c(20) }}
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
                  fontSize: c(54),
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
            {/* ADDED slots: location / room / time as a mono info row */}
            {(slots.location || slots.room || slots.time) && (
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: c(34),
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

        {/* Lockup */}
        {slots.lockup && (
          <div
            className="absolute text-right"
            style={{ left: pctX(1500), top: pctY(840), width: pctX(360) }}
          >
            <div
              style={{
                fontFamily: display,
                fontWeight: 800,
                fontSize: c(150),
                lineHeight: 0.8,
                color: variant.accent,
              }}
            >
              air
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: c(28),
                color: variant.light,
                letterSpacing: c(6),
              }}
            >
              AI IN REACH
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
