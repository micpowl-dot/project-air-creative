"use client";

import { useEffect, useRef, useState } from "react";
import { resolveCutout } from "@/data/headshots";
import {
  type PosterData,
  type PosterSlots,
  type PosterVariant,
  type RingStyle,
  type TopStyle,
  type PosterFormat,
  DEFAULT_SLOTS,
  DEFAULT_RING_STYLE,
  DEFAULT_TOP_STYLE,
  RING_SIZE,
  TOP_SIZE,
  PORTRAIT_SIZE,
  SQUIGGLE_SIZE,
  compTransform,
  type ProfileLayout,
  type ProfileComp,
  type CompTransform,
} from "@/lib/poster";
import { AiDayLogo } from "./AiDayLogo";
import { AirLogo } from "./AirLogo";

// Unit helpers per design space. 1cqw = 1% of the poster's rendered width, so
// everything scales with the poster regardless of display size.
const mk = (baseW: number, baseH: number) => ({
  c: (px: number) => `${((px / baseW) * 100).toFixed(3)}cqw`,
  px: (x: number) => `${((x / baseW) * 100).toFixed(3)}%`,
  py: (y: number) => `${((y / baseH) * 100).toFixed(3)}%`,
});
const WIDE = mk(1920, 1080);
const SQUARE = mk(1080, 1080);

const RING_CENTER = { x: 1347.5, y: 595.5 };
const RING_BASE = 875;
const SQ_RING_CENTER = { x: 800, y: 786 };
const SQ_RING_BASE = 840;

/** Perceived-luminance check so we can pick a contrasting color. */
function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

type Unit = (n: number) => string;

/** Two-layer portrait: selectable background pattern + transparent cutout on
 *  top, with an initials fallback if the cutout is missing. */
function HeadshotSquare({ name, bg, c }: { name: string; bg: string; c: Unit }) {
  const r = resolveCutout(name);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setErrored(true);
  }, [r.src]);
  const showImg = r.src && !errored;
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* background layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/headshots/bg/${bg}.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* cutout on top, or initials over the background */}
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={r.src!} alt={name} onError={() => setErrored(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color: "#fff", fontFamily: "var(--font-poster-display)", fontWeight: 800, fontSize: c(140) }}>
            {r.initials}
          </span>
        </div>
      )}
    </div>
  );
}

/** 1–3 headshots laid out as squares, centered on the ring badge.
 *  The whole group (squares + the gap) scales as a unit. */
function PortraitGroup({
  names,
  scale,
  dx = 0,
  center,
  baseSize,
  bg,
  c,
  px,
  py,
}: {
  names: string[];
  scale: number;
  dx?: number;
  center: { x: number; y: number };
  baseSize: number;
  bg: string;
  c: Unit;
  px: Unit;
  py: Unit;
}) {
  const list = names.slice(0, 3);
  const n = Math.max(1, list.length);
  const base = n === 1 ? { size: baseSize, gap: 0 } : n === 2 ? { size: baseSize * 0.747, gap: baseSize * 0.058 } : { size: baseSize * 0.622, gap: baseSize * 0.041 };
  const cfg = { size: base.size * scale, gap: base.gap * scale };
  const totalW = cfg.size * n + cfg.gap * (n - 1);
  const left = center.x - totalW / 2 + dx;
  const top = center.y - cfg.size / 2;
  return (
    <div className="absolute flex" style={{ left: px(left), top: py(top), gap: c(cfg.gap) }}>
      {list.map((person, i) => (
        <div key={person + i} style={{ width: c(cfg.size), height: c(cfg.size) }}>
          <HeadshotSquare name={person} bg={bg} c={c} />
        </div>
      ))}
    </div>
  );
}

/** Names joined by a contrasting "+" separator, each name unbroken. */
function NameLine({ data, ink, display, size }: { data: PosterData; ink: string; display: string; size: string }) {
  const names = data.names.length ? data.names : [data.name];
  const plus = isDark(ink) ? "#ffffff" : "#000000";
  return (
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 0.95, color: ink }}>
      {names.map((nm, i) => (
        <span key={nm + i}>
          <span style={{ whiteSpace: "nowrap" }}>{nm}</span>
          {i < names.length - 1 ? <span style={{ color: plus }}> + </span> : null}
        </span>
      ))}
    </div>
  );
}

function infoRow(data: PosterData, slots: PosterSlots): string {
  return [
    slots.location && data.location && data.location,
    slots.room && data.room && `ROOM ${data.room}`,
    slots.time && data.time && data.time,
  ]
    .filter(Boolean)
    .join("   ·   ");
}

export interface PosterProps {
  data: PosterData;
  variant: PosterVariant;
  format?: PosterFormat;
  slots?: PosterSlots;
  ringStyle?: RingStyle;
  topStyle?: TopStyle;
  ringSize?: number;
  topSize?: number;
  topOpacity?: number;
  topFlip?: boolean;
  portraitSize?: number;
  nameScale?: number;
  roleScale?: number;
  headshotBg?: string;
  useAltHeadshot?: boolean;
  badgeOffsetX?: number;
  dateSize?: number;
  tagSize?: number;
  topOffsetX?: number;
  topOffsetY?: number;
  bottomOffsetX?: number;
  bottomOffsetY?: number;
  squiggleSize?: number;
  squiggleOffsetX?: number;
  squiggleOffsetY?: number;
  layout?: ProfileLayout;
}

export function Poster(props: PosterProps) {
  return props.format === "square" ? <SquarePoster {...props} /> : <WidePoster {...props} />;
}

function WidePoster({
  data,
  variant,
  slots = DEFAULT_SLOTS,
  ringStyle = DEFAULT_RING_STYLE,
  topStyle = DEFAULT_TOP_STYLE,
  ringSize = RING_SIZE.default,
  topSize = TOP_SIZE.default,
  topOpacity = 1,
  topFlip = false,
  portraitSize = PORTRAIT_SIZE.default,
  headshotBg = "magenta",
  badgeOffsetX = 0,
  dateSize = 1,
  tagSize = 1,
  topOffsetX = 0,
  topOffsetY = 0,
  bottomOffsetX = 0,
  bottomOffsetY = 0,
  squiggleSize = SQUIGGLE_SIZE.default,
  squiggleOffsetX = 0,
  squiggleOffsetY = 0,
}: PosterProps) {
  const { c, px, py } = WIDE;
  const mono = "var(--font-poster-mono)";
  const display = "var(--font-poster-display)";
  const ringPx = RING_BASE * ringSize;
  const ringLeft = RING_CENTER.x - ringPx / 2 + badgeOffsetX;
  const ringTop = RING_CENTER.y - ringPx / 2;
  const names = data.names.length ? data.names : [data.name];
  const nameSize = c(names.length >= 3 ? 78 : names.length === 2 ? 96 : 120);

  return (
    <div style={{ containerType: "inline-size" }} className="relative w-full" aria-label={`Poster for ${data.name}`}>
      <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 9", background: variant.bg, color: variant.ink }}>
        {slots.eventMark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/poster-elements/top-edge/${topStyle}.png`}
            alt=""
            className="absolute object-cover"
            style={{ right: 0, top: 0, width: px(1019 * topSize), height: py(300 * topSize), objectPosition: "right top", opacity: topOpacity, transform: `translate(${c(topOffsetX)}, ${c(topOffsetY)})${topFlip ? " scaleX(-1)" : ""}` }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poster-elements/bottom-left/quarter-circles.png" alt="" className="absolute object-contain object-left-bottom" style={{ left: 0, bottom: 0, width: px(986), height: py(365), opacity: 0.9, transform: `translate(${c(bottomOffsetX)}, ${c(bottomOffsetY)})` }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poster-elements/mid/squiggle.png" alt="" className="absolute object-contain" style={{ left: px(-120), top: py(905), width: px(1100 * squiggleSize), height: py(240 * squiggleSize), transform: `translate(${c(squiggleOffsetX)}, ${c(squiggleOffsetY)})` }} />
        {slots.ringBadge && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/poster-elements/center/${ringStyle}.png`} alt="" className="absolute object-contain" style={{ left: px(ringLeft), top: py(ringTop), width: px(ringPx), height: py(ringPx) }} />
        )}
        {slots.tag && data.tag && (
          <div className="absolute" style={{ left: px(78), top: py(40), fontFamily: mono, fontWeight: 500, fontSize: c(50 * tagSize), color: variant.accent, lineHeight: 1 }}>
            {data.tag}
          </div>
        )}
        {slots.portrait && (
          <PortraitGroup names={names} scale={portraitSize} dx={badgeOffsetX} bg={headshotBg} center={RING_CENTER} baseSize={482} c={c} px={px} py={py} />
        )}
        <div className="absolute flex" style={{ left: px(50), top: py(150), width: px(820), gap: c(20) }}>
          <div style={{ width: c(8), background: variant.accent, alignSelf: "stretch" }} />
          <div className="flex flex-col" style={{ gap: c(14) }}>
            {slots.name && <NameLine data={data} ink={variant.ink} display={display} size={nameSize} />}
            {slots.role && data.role && <div style={{ fontFamily: display, fontSize: c(46), color: variant.ink }}>{data.role}</div>}
            {slots.sessionTitle && <div style={{ fontFamily: display, fontWeight: 700, fontSize: c(58), color: variant.ink }}>{data.sessionTitle}</div>}
            {(slots.location || slots.room || slots.time) && (
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(36), color: variant.light, marginTop: c(8), letterSpacing: c(1) }}>{infoRow(data, slots)}</div>
            )}
            {slots.date && <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(46 * dateSize), color: variant.light, letterSpacing: c(2), marginTop: c(6) }}>{data.dateLabel}</div>}
          </div>
        </div>
        {slots.lockup && (
          <>
            <div className="absolute" style={{ left: px(1448), top: py(848), width: px(436), height: py(212), background: variant.bg }} />
            <AiDayLogo accent={variant.accent} ink={variant.ink} light={variant.light} className="absolute" style={{ left: px(1470), top: py(870), width: px(390) }} />
          </>
        )}
      </div>
    </div>
  );
}

function SquarePoster({
  data,
  variant,
  slots = DEFAULT_SLOTS,
  ringStyle = DEFAULT_RING_STYLE,
  topStyle = DEFAULT_TOP_STYLE,
  topFlip = false,
  headshotBg = "magenta",
  tagSize = 1,
  nameScale = 1,
  roleScale = 1,
  layout,
}: PosterProps) {
  const { c, px, py } = SQUARE;
  const mono = "var(--font-poster-mono)";
  const display = "var(--font-poster-display)";
  const ringPx = SQ_RING_BASE;
  const ringLeft = SQ_RING_CENTER.x - ringPx / 2;
  const ringTop = SQ_RING_CENTER.y - ringPx / 2;
  const names = data.names.length ? data.names : [data.name];
  const nameSize = c((names.length >= 3 ? 44 : names.length === 2 ? 56 : 72) * nameScale);

  // transform/opacity for one component, scaled around the given CSS origin.
  const tf = (comp: ProfileComp, origin: string, extra = ""): React.CSSProperties => {
    const t: CompTransform = compTransform(layout, comp);
    return {
      transform: `translate(${c(t.x)}, ${c(t.y)}) scale(${t.scale})${extra ? ` ${extra}` : ""}`,
      transformOrigin: origin,
      opacity: t.opacity,
    };
  };
  const pct = (v: number, base: number) => `${((v / base) * 100).toFixed(2)}%`;

  return (
    <div style={{ containerType: "inline-size" }} className="relative w-full" aria-label={`Poster for ${data.name}`}>
      <div className="relative overflow-hidden" style={{ aspectRatio: "1 / 1", background: variant.bg, color: variant.ink }}>
        {/* Composition follows the Figma "LinkedIn Template" (1080x1080):
            AI DAY top-left, piano-stripes top-right, date top-right, speaker
            block left-middle, ring badge + headshot bottom-right, air lockup
            bottom-left, squiggle mid-left. Each element can be moved, scaled,
            and faded independently via the per-component `layout`. */}

        {/* top-edge graphic, top-right */}
        {slots.eventMark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/poster-elements/top-edge/${topStyle}.png`} alt="" className="absolute object-cover" style={{ right: 0, top: 0, width: px(540), height: py(360), objectPosition: "right top", ...tf("top", "right top", topFlip ? "scaleX(-1)" : "") }} />
        )}

        {/* squiggle, mid-left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poster-elements/mid/squiggle.png" alt="" className="absolute object-contain" style={{ left: px(-30), top: py(700), width: px(560), height: py(220), ...tf("squiggle", "left center") }} />

        {/* ring badge and headshot are independent — each scales/moves/fades
            on its own, both pivoting on the ring center */}
        {slots.ringBadge && (
          <div className="absolute inset-0" style={tf("ring", `${pct(SQ_RING_CENTER.x, 1080)} ${pct(SQ_RING_CENTER.y, 1080)}`)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/poster-elements/center/${ringStyle}.png`} alt="" className="absolute object-contain" style={{ left: px(ringLeft), top: py(ringTop), width: px(ringPx), height: py(ringPx) }} />
          </div>
        )}
        {slots.portrait && (
          <div className="absolute inset-0" style={tf("headshot", `${pct(SQ_RING_CENTER.x, 1080)} ${pct(SQ_RING_CENTER.y, 1080)}`)}>
            <PortraitGroup names={names} scale={1} bg={headshotBg} center={SQ_RING_CENTER} baseSize={430} c={c} px={px} py={py} />
          </div>
        )}

        {/* AI DAY wordmark, top-left, with a background-colored box behind it */}
        {slots.lockup && (
          <div className="absolute inset-0" style={tf("aiday", "left top")}>
            <div className="absolute" style={{ left: px(36), top: py(48), width: px(600), height: py(252), background: variant.bg }} />
            <AiDayLogo accent={variant.accent} ink={variant.ink} light={variant.light} className="absolute" style={{ left: px(54), top: py(70), width: px(560) }} />
          </div>
        )}

        {/* date, top-right under the stripes — trailing "26" in ink */}
        {slots.date && (
          <div className="absolute text-right" style={{ left: px(560), top: py(392), width: px(474), fontFamily: mono, fontWeight: 500, fontSize: c(46), color: variant.light, letterSpacing: c(2), ...tf("date", "right top") }}>
            <span>{data.dateLabel.slice(0, -2)}</span>
            <span style={{ color: variant.ink }}>{data.dateLabel.slice(-2)}</span>
          </div>
        )}

        {/* speaker block, left-middle: accent bar + name / tag */}
        <div className="absolute flex" style={{ left: px(54), top: py(452), width: px(620), gap: c(20), ...tf("speaker", "left top") }}>
          <div style={{ width: c(8), background: variant.accent, alignSelf: "stretch" }} />
          <div className="flex flex-col" style={{ gap: c(12) }}>
            {slots.name && <NameLine data={data} ink={variant.ink} display={display} size={nameSize} />}
            {slots.role && data.role && <div style={{ fontFamily: display, fontWeight: 400, fontSize: c(40 * roleScale), color: variant.ink, lineHeight: 1.05 }}>{data.role}</div>}
            {slots.sessionTitle && <div style={{ fontFamily: display, fontWeight: 700, fontSize: c(40), color: variant.ink }}>{data.sessionTitle}</div>}
            {slots.tag && data.tag && <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(40 * tagSize), color: variant.accent, marginTop: c(10) }}>{data.tag}</div>}
            {(slots.location || slots.room || slots.time) && (
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: c(26), color: variant.light, letterSpacing: c(1) }}>{infoRow(data, slots)}</div>
            )}
          </div>
        </div>

        {/* AIR lockup, bottom-left — "AI" + "IN" follow the scheme accent */}
        {slots.lockup && (
          <AirLogo accent={variant.accent} light={variant.light} className="absolute" style={{ left: px(60), bottom: py(64), width: px(300), ...tf("air", "left bottom") }} />
        )}
      </div>
    </div>
  );
}
