import type { Session } from "@/lib/types";
import { Headshot } from "./Headshot";

function trackVar(track: Session["track"]): string {
  return `var(--track-${track})`;
}

const SITE_LABELS: Array<[keyof Session["rooms"], string]> = [
  ["brookhaven", "Brookhaven"],
  ["andover", "Andover"],
  ["newYork", "New York"],
];

export function SessionCard({
  session,
  compact = false,
}: {
  session: Session;
  compact?: boolean;
}) {
  const accent = trackVar(session.track);
  return (
    <article
      className="flex h-full flex-col rounded-xl border bg-[var(--surface)] p-4"
      style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
    >
      <div
        className="mb-3 h-1.5 w-10 rounded-full"
        style={{ background: accent }}
      />
      <h3 className="font-display text-lg leading-tight text-[var(--ink)]">
        {session.title}
        {session.isRepeat && (
          <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-[var(--ink-soft)]">
            repeat
          </span>
        )}
      </h3>

      {!compact && session.description && (
        <p className="mt-2 text-sm leading-snug text-[var(--ink-soft)]">
          {session.description}
        </p>
      )}

      {/* Instructors with auto-resolved headshots */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {session.instructors.map((person) => (
          <span key={person} className="inline-flex items-center gap-2">
            <Headshot name={person} size={36} ring={accent} />
            <span className="text-sm font-medium text-[var(--ink)]">
              {person}
            </span>
          </span>
        ))}
      </div>

      {/* Rooms per site */}
      <dl className="mt-auto pt-3 text-xs text-[var(--ink-soft)]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SITE_LABELS.map(([key, label]) =>
            session.rooms[key] ? (
              <div key={String(key)}>
                <dt className="inline font-semibold uppercase tracking-wide">
                  {label}:{" "}
                </dt>
                <dd className="inline">{String(session.rooms[key])}</dd>
              </div>
            ) : null
          )}
          {session.rooms.meetUrl ? (
            <a
              href={session.rooms.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline underline decoration-dotted underline-offset-2"
              style={{ color: accent }}
            >
              ● Join Meet
            </a>
          ) : (
            session.rooms.remote && (
              <div className="inline" style={{ color: accent }}>
                ● Remote (Meet)
              </div>
            )
          )}
        </div>
      </dl>
    </article>
  );
}
