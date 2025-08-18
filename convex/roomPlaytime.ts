import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  //   computePointersFromIndex,
  computeRiddlePointersFromIndex,
  computeUserPointersFromIndex,
} from "./utils/fns";

export const createRoomPlaytime = mutation({
  args: {
    roomId: v.id("rooms"),
    riddles: v.array(v.object({ _id: v.id("riddles") })),
  },
  handler: async (ctx, { riddles, roomId }) => {
    const newriddles = riddles.map((r) => ({ ...r, done: false }));
    // find the first not-done (usually 0)
    const firstIdx = newriddles.findIndex((r) => !r.done);
    // const { current, previous, next } = computePointersFromIndex(
    //   newriddles,
    //   firstIdx === -1 ? null : firstIdx
    // );

    const { currentRiddle, previousRiddle, nextRiddle } =
      computeRiddlePointersFromIndex(
        // reuse computeRiddlePointersFromIndex shape: adapt quickly
        // quick map because computeRiddlePointersFromIndex expects objects with _id/done
        newriddles,
        firstIdx === -1 ? null : firstIdx
      );

    const payload = {
      roomId,
      riddles: newriddles,
      play: undefined,

      playing: true,
      completed: false,

      currentRiddle,
      previousRiddle,
      nextRiddle,

      currentUser: undefined,
      currentRiddleIndex: undefined,
      previousRiddleIndex: undefined,
    };

    return await ctx.db.insert("roomPlaytimes", payload);
  },
});

export const onStartGame = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (!room?.playtimeId) {
      throw new Error("Room playtime not found");
    }
    // 1) load players for roomId
    const players = await ctx.db
      .query("roomPlayers")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .collect();

    if (players.length === 0) throw new Error("No players to start the game");

    const playerIds = players
      .sort((a, b) => (a.joinIndex ?? 0) - (b.joinIndex ?? 0))
      .map((p) => p.userId);

    let startUser = room.startUser;
    if (
      !startUser ||
      !playerIds.some((pid) => String(pid) === String(startUser))
    ) {
      // fallback: pick random
      startUser = playerIds[Math.floor(Math.random() * playerIds.length)];
    }

    const startIndex = playerIds.findIndex(
      (id) => String(id) === String(startUser)
    );
    const pointers = computeUserPointersFromIndex(
      playerIds.map((u) => ({ userId: u })),
      startIndex === -1 ? null : startIndex
    );

    // 3) update roomPlaytime with computed user pointers
    await ctx.db.patch(room?.playtimeId, {
      playing: true,
      currentUser: pointers.currentUser,
      previousUser: pointers.previousUser,
      nextUser: pointers.nextUser,
    });

    return {
      ok: true,
      playtimeId: room.playtimeId,
      pointers: pointers,
    };
  },
});

export const advanceRoomPlaytime = mutation({
  args: {
    playtimeId: v.id("roomPlaytimes"),
    result: v.optional(
      v.union(
        v.literal("correct"),
        v.literal("incorrect"),
        v.literal("skipped")
      )
    ),
  },
  handler: async (ctx, { playtimeId, result }) => {
    // 1) fetch playtime
    const playtime = await ctx.db.get(playtimeId);
    if (!playtime) throw new Error("Playtime not found");

    if (!playtime.playing) {
      return { ok: false, message: "Playtime is not playing" };
    }

    // 2) load players for this room (to rotate turns)
    const playersQuery = await ctx.db
      .query("roomPlayers")
      .filter((q) => q.eq(q.field("roomId"), playtime.roomId))
      .collect();
    const playerIds = playersQuery.map((p) => p.userId);

    if (playerIds.length === 0) {
      throw new Error("No players found for this room");
    }

    // 3) determine current user and its index
    const currentUserId = playtime.currentUser;
    let currentUserIndex = currentUserId
      ? playerIds.findIndex((id) => String(id) === String(currentUserId))
      : -1;

    // If currentUser undefined, start with first player
    if (currentUserIndex === -1) currentUserIndex = 0;

    const nextUserIndex = (currentUserIndex + 1) % playerIds.length;

    // 4) find current riddle index inside playtime.riddles (by id)
    const riddlesArr = playtime.riddles || [];
    const currentRiddleId = playtime.currentRiddle;
    const currentRiddleIndex = currentRiddleId
      ? riddlesArr.findIndex((r) => String(r._id) === String(currentRiddleId))
      : -1;

    // 5) append a play entry recording the attempt (if there's a current riddle)
    const newPlayEntry =
      currentRiddleId !== undefined && currentRiddleId !== null
        ? {
            riddleId: currentRiddleId,
            done: true,
            playedBy: playerIds[currentUserIndex],
            turnIndex: playtime.play?.length ?? 0,
            result: result ?? "skipped",
          }
        : null;

    // 6) mark current riddle done in riddles array
    const newRiddles = riddlesArr.slice();
    if (currentRiddleIndex >= 0) {
      newRiddles[currentRiddleIndex] = {
        ...newRiddles[currentRiddleIndex],
        done: true,
      };
    }

    // 7) compute next riddle pointers
    // choose next not-done riddle index after currentRiddleIndex
    let nextRiddleIdx = -1;
    for (let i = currentRiddleIndex + 1; i < newRiddles.length; i++) {
      if (!newRiddles[i].done) {
        nextRiddleIdx = i;
        break;
      }
    }
    // fallback: search from beginning (circular) if you want round-robin riddles; here we'll treat it linear
    // compute pointers for the next current riddle index
    const pointerObj = computeRiddlePointersFromIndex(
      newRiddles,
      nextRiddleIdx === -1 ? null : nextRiddleIdx
    );

    // 8) prepare DB patch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = {
      riddles: newRiddles,
      // append to play array if newPlayEntry
      play: playtime.play
        ? playtime.play.concat(newPlayEntry ? [newPlayEntry] : [])
        : newPlayEntry
          ? [newPlayEntry]
          : undefined,
      previousUser: playerIds[currentUserIndex],
      currentUser: playerIds[nextUserIndex],
      nextUser: playerIds[(nextUserIndex + 1) % playerIds.length],
      previousRiddle: playtime.currentRiddle,
      currentRiddle: pointerObj.currentRiddle,
      nextRiddle: pointerObj.nextRiddle,
    };

    // 9) if there is no next riddle (finished), mark completed and stop playing
    if (!pointerObj.currentRiddle) {
      patch.playing = false;
      patch.completed = true;
      patch.currentRiddle = undefined;
      patch.nextRiddle = undefined;
    }

    // 10) update DB
    await ctx.db.patch(playtimeId, patch);

    // 11) return updated pointers
    return {
      ok: true,
      playtimeId,
      pointers: {
        previousUser: patch.previousUser,
        currentUser: patch.currentUser,
        nextUser: patch.nextUser,
        previousRiddle: patch.previousRiddle,
        currentRiddle: patch.currentRiddle,
        nextRiddle: patch.nextRiddle,
        completed: patch.completed ?? false,
      },
    };
  },
});
