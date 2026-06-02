"use client";

import { useEffect, useRef, useState } from "react";
import { resolveHeadshot } from "@/data/headshots";

/**
 * Renders a person's headshot resolved by name, with a branded initials
 * placeholder when the photo is missing or fails to load. Plain <img> is used
 * intentionally so dynamic /public paths work without next/image config.
 *
 * Note: we check the image after mount as well as via onError. An <img> that
 * 404s during the initial HTML load fires its error event BEFORE React hydrates
 * and attaches onError, so onError alone would miss it and leave a broken glyph.
 */
export function Headshot({
  name,
  size = 56,
  ring,
}: {
  name: string;
  size?: number;
  ring?: string; // accent ring color (e.g. a track color)
}) {
  const r = resolveHeadshot(name);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    // Catch images that already failed before hydration.
    if (img && img.complete && img.naturalWidth === 0) {
      setErrored(true);
    }
  }, [r.src]);

  const showImg = r.src && !errored;

  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderColor: ring ?? "var(--accent)",
      }}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-[var(--surface-alt)] text-[var(--ink-soft)]"
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={r.src!}
          alt={name}
          width={size}
          height={size}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-display font-semibold leading-none"
          style={{ fontSize: size * 0.34 }}
        >
          {r.initials}
        </span>
      )}
    </span>
  );
}
