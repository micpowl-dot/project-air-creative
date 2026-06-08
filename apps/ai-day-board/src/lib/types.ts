// Shared types for the AI Day board.
// The schedule shape mirrors the table stored on The Drop and is produced by
// the scheduled mirror (scripts/sync-schedule.mjs) into src/data/schedule.json.

export type TrackId = "explore" | "apply" | "build";

export interface Track {
  id: TrackId;
  name: string; // EXPLORE / APPLY / BUILD
  subtitle: string; // Strategy + Culture, etc.
}

/** Rooms a session runs in, one per physical site (plus a remote link). */
export interface RoomSet {
  brookhaven?: string;
  andover?: string;
  newYork?: string;
  remote?: boolean; // true when a Google Meet link is offered
  meetUrl?: string; // the actual Google Meet join link
}

export interface Session {
  track: TrackId;
  title: string;
  description?: string;
  instructors: string[];
  rooms: RoomSet;
  isRepeat?: boolean;
  noTag?: boolean; // suppress the track tag (e.g. Opening/Closing Remarks)
}

/**
 * A row in the schedule. Two shapes:
 *  - "sessions": three parallel track sessions (the normal case)
 *  - "full": a single full-width item (opening, lunch, closing, social)
 */
export interface ScheduleSlot {
  time: string; // "10:00", display as-is
  kind: "sessions" | "full";
  // kind === "sessions"
  sessions?: Session[];
  // kind === "full"
  title?: string;
  people?: string[];
  rooms?: RoomSet;
  note?: string;
}

export interface Schedule {
  title: string;
  date: string;
  sourceUrl: string;
  lastSynced: string; // ISO timestamp written by the mirror
  tracks: Track[];
  slots: ScheduleSlot[];
}
