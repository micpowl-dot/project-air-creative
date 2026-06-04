"use client";

import { resolveCutout } from "@/data/headshots";

export const HEADSHOT_OUT = 1200; // native art size (square, RGBA)

/** Two-layer branded headshot: palette-pattern background + transparent cutout
 *  on top, with an initials fallback when no cutout exists. Rendered at the
 *  native 1200×1200 so it can be exported to PNG at full resolution. */
export function ComposedHeadshot({
  name,
  bg,
  zoom = 1,
  offsetY = 0,
  size = HEADSHOT_OUT,
  innerRef,
}: {
  name: string;
  bg: string;
  zoom?: number;
  offsetY?: number;
  size?: number;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const r = resolveCutout(name);
  return (
    <div ref={innerRef} className="relative overflow-hidden" style={{ width: size, height: size }}>
      {/* layer 1: background pattern */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/headshots/bg/${bg}.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* layer 2: transparent person cutout, or initials fallback */}
      {r.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `translateY(${offsetY}%) scale(${zoom})`, transformOrigin: "center bottom" }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color: "#fff", fontFamily: "var(--font-poster-display)", fontWeight: 800, fontSize: size * 0.3 }}>
            {r.initials}
          </span>
        </div>
      )}
    </div>
  );
}
