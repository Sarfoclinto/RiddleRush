// src/utils/rooms.ts

export type Playtime = {
  _id: string;
  playing?: boolean;
  // ...other fields
};

export type RoomWithPlaytime = {
  _id: string;
  creationTime?: number; // seconds or milliseconds
  playtime?: Playtime | null;
  // ...other fields
};

export type FilterMode = "all" | "playing" | "not_playing";

/** normalize timestamp to milliseconds (handles seconds vs ms) */
export function normalizeTimestampMs(ts?: number): number {
  if (ts == null) return 0;
  return ts < 1_000_000_000_000 ? ts * 1000 : ts;
}

/** Filter rooms by playtime state.
 * - "all": return all rooms
 * - "playing": return rooms with playtime && playtime.playing === true
 * - "not_playing": return rooms with playtime && playtime.playing === false
 */
export function filterRooms(
  rooms: RoomWithPlaytime[] | undefined | null,
  mode: FilterMode
): RoomWithPlaytime[] {
  if (!rooms) return [];
  switch (mode) {
    case "all":
      return rooms;
    case "playing":
      return rooms.filter((r) => !!r.playtime && r.playtime.playing === true);
    case "not_playing":
      return rooms.filter((r) => !!r.playtime && r.playtime.playing !== true);
    default:
      return rooms;
  }
}

/** Sort rooms by creationTime.
 * - order: 'desc' (newest first) or 'asc' (oldest first)
 * - Rooms without creationTime are treated as epoch (0) so they usually sort last in 'desc' and first in 'asc'.
 */
export function sortByCreationTime(
  rooms: RoomWithPlaytime[] | undefined | null,
  order: "desc" | "asc" = "desc"
): RoomWithPlaytime[] {
  if (!rooms) return [];
  return [...rooms].sort((a, b) => {
    const aMs = normalizeTimestampMs(a.creationTime);
    const bMs = normalizeTimestampMs(b.creationTime);
    if (aMs === bMs) return 0;
    return order === "desc" ? bMs - aMs : aMs - bMs;
  });
}

/** Convenience: filter + sort in one call */
export function filterAndSortRooms(
  rooms: RoomWithPlaytime[] | undefined | null,
  mode: FilterMode,
  order: "desc" | "asc" = "desc"
): RoomWithPlaytime[] {
  const filtered = filterRooms(rooms, mode);
  return sortByCreationTime(filtered, order);
}

// use case
/**
 * 

// inside your component
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  filterRooms,
  sortByCreationTime,
  filterAndSortRooms,
  type FilterMode,
} from "@/utils/rooms";

const Example = () => {
  const rooms = useQuery(api.rooms.getPublicRooms); // returns RoomWithPlaytime[]

  // choose a mode (could come from state/UI)
  const mode: FilterMode = "not_playing";

  // get filtered+sorted rooms (newest first)
  const displayed = filterAndSortRooms(rooms, mode, "desc");

  return (
    <div>
      {displayed.map((r) => (
        <div key={r._id}>
          <div>{ room fields }</div>
          <div>playing: {String(!!r.playtime?.playing)}</div>
        </div>
      ))}
    </div>
  );
};


 */
