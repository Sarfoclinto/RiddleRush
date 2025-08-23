import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  //   computePointersFromIndex,
  computeRiddlePointersFromIndex,
  computeUserPointersFromIndex,
} from "./utils/fns";
import type { Id } from "./_generated/dataModel";

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
      .withIndex("by_ready", (q) => q.eq("roomId", room._id).eq("ready", true))
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
      currentUser: pointers.currentUser,
      previousUser: pointers.previousUser,
      nextUser: pointers.nextUser,
    });

    await ctx.db.patch(room._id, { playing: true });

    return {
      ok: true,
      roomId,
      playtimeId: room.playtimeId,
      pointers: pointers,
    };
  },
});

// export const advanceRoomPlaytime = mutation({
//   args: {
//     playtimeId: v.id("roomPlaytimes"),
//     result: v.optional(
//       v.union(
//         v.literal("correct"),
//         v.literal("incorrect"),
//         v.literal("skipped"),
//         v.literal("timedOut")
//       )
//     ),
//   },
//   handler: async (ctx, { playtimeId, result }) => {
//     // 1) fetch playtime
//     const playtime = await ctx.db.get(playtimeId);
//     if (!playtime) throw new Error("Playtime not found");

//     // if (!playtime.playing) {
//     //   return { ok: false, message: "Playtime is not playing" };
//     // }

//     // 2) load players for this room (to rotate turns)
//     const playersQuery = await ctx.db
//       .query("roomPlayers")
//       // .filter((q) => q.eq(q.field("roomId"), playtime.roomId))
//       .withIndex("by_ready", (q) =>
//         q.eq("roomId", playtime.roomId).eq("ready", true)
//       )
//       .collect();
//     const playerIds = playersQuery.map((p) => p.userId);

//     if (playerIds.length === 0) {
//       throw new Error("No players found for this room");
//     }

//     // 3) determine current user and its index
//     const currentUserId = playtime.currentUser;
//     let currentUserIndex = currentUserId
//       ? playerIds.findIndex((id) => String(id) === String(currentUserId))
//       : -1;

//     // If currentUser undefined, start with first player
//     if (currentUserIndex === -1) currentUserIndex = 0;

//     const nextUserIndex = (currentUserIndex + 1) % playerIds.length;

//     // 4) find current riddle index inside playtime.riddles (by id)
//     const riddlesArr = playtime.riddles || [];
//     const currentRiddleId = playtime.currentRiddle;
//     const currentRiddleIndex = currentRiddleId
//       ? riddlesArr.findIndex((r) => String(r._id) === String(currentRiddleId))
//       : -1;

//     // 5) append a play entry recording the attempt (if there's a current riddle)
//     const newPlayEntry =
//       currentRiddleId !== undefined && currentRiddleId !== null
//         ? {
//             riddleId: currentRiddleId,
//             done: true,
//             playedBy: playerIds[currentUserIndex],
//             turnIndex: playtime.play?.length ?? 0,
//             result: result ?? "skipped",
//           }
//         : null;

//     // 6) mark current riddle done in riddles array
//     const newRiddles = riddlesArr.slice();
//     if (currentRiddleIndex >= 0) {
//       newRiddles[currentRiddleIndex] = {
//         ...newRiddles[currentRiddleIndex],
//         done: true,
//       };
//     }

//     // 7) compute next riddle pointers
//     // choose next not-done riddle index after currentRiddleIndex
//     let nextRiddleIdx = -1;
//     for (let i = currentRiddleIndex + 1; i < newRiddles.length; i++) {
//       if (!newRiddles[i].done) {
//         nextRiddleIdx = i;
//         break;
//       }
//     }
//     // fallback: search from beginning (circular) if you want round-robin riddles; here we'll treat it linear
//     // compute pointers for the next current riddle index
//     const pointerObj = computeRiddlePointersFromIndex(
//       newRiddles,
//       nextRiddleIdx === -1 ? null : nextRiddleIdx
//     );

//     // 8) prepare DB patch
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const patch: any = {
//       riddles: newRiddles,
//       // append to play array if newPlayEntry
//       play: playtime.play
//         ? playtime.play.concat(newPlayEntry ? [newPlayEntry] : [])
//         : newPlayEntry
//           ? [newPlayEntry]
//           : undefined,
//       previousUser: playerIds[currentUserIndex],
//       currentUser: playerIds[nextUserIndex],
//       nextUser: playerIds[(nextUserIndex + 1) % playerIds.length],
//       previousRiddle: playtime.currentRiddle,
//       currentRiddle: pointerObj.currentRiddle,
//       nextRiddle: pointerObj.nextRiddle,
//     };

//     // 9) if there is no next riddle (finished), mark completed and stop playing
//     if (!pointerObj.currentRiddle) {
//       // patch.playing = false;
//       patch.completed = true;
//       patch.currentRiddle = undefined;
//       patch.nextRiddle = undefined;
//     }

//     // 10) update DB
//     await ctx.db.patch(playtimeId, patch);

//     // 11) return updated pointers
//     return {
//       ok: true,
//       playtimeId,
//       pointers: {
//         previousUser: patch.previousUser,
//         currentUser: patch.currentUser,
//         nextUser: patch.nextUser,
//         previousRiddle: patch.previousRiddle,
//         currentRiddle: patch.currentRiddle,
//         nextRiddle: patch.nextRiddle,
//         completed: patch.completed ?? false,
//       },
//     };
//   },
// });

export const advancePlaytime = mutation({
  args: {
    playtimeId: v.id("roomPlaytimes"),
    result: v.optional(
      v.union(
        v.literal("correct"),
        v.literal("incorrect"),
        v.literal("skipped"),
        v.literal("timedOut")
      )
    ),
  },
  handler: async (ctx, { playtimeId, result }) => {
    // 0) optimistic locking / transaction note:
    // If your DB supports transactions or conditional patching (if-match / _rev), use that here.
    // Otherwise multiple simultaneous calls can clobber each other.
    // Example: const playtime = await ctx.db.get(playtimeId, { ifMatch: knownRev });

    // 1) fetch current playtime
    const playtime = await ctx.db.get(playtimeId);
    if (!playtime) throw new Error("Playtime not found");

    if (!playtime.roomId) throw new Error("Playtime has no roomId");

    // 2) load players for this room (only ready players) and sort by joinIndex
    const playersRaw = await ctx.db
      .query("roomPlayers")
      .withIndex("by_ready", (q) =>
        q.eq("roomId", playtime.roomId).eq("ready", true)
      )
      .collect();

    if (!playersRaw || playersRaw.length === 0) {
      throw new Error("No players found for this room");
    }

    // stable turn order: sort by joinIndex (fall back to userId string)
    const players = playersRaw.slice().sort((a, b) => {
      const ai = (a.joinIndex ?? Number.MAX_SAFE_INTEGER) as number;
      const bi = (b.joinIndex ?? Number.MAX_SAFE_INTEGER) as number;
      if (ai !== bi) return ai - bi;
      return String(a.userId).localeCompare(String(b.userId));
    });

    const playerIds = players.map((p) => p.userId);

    // 3) find current user index (if currentUser exists) or -1
    const currentUserId = playtime.currentUser;
    let currentUserIndex = currentUserId
      ? playerIds.findIndex((id) => String(id) === String(currentUserId))
      : -1;

    // If currentUser is not found in player list (player left), treat as -1
    if (currentUserIndex === -1) {
      // first turn or mismatch -> we do NOT set previousUser to a real id
      currentUserIndex = 0;
    }

    const nextUserIndex = (currentUserIndex + 1) % playerIds.length;

    // 4) find current riddle index inside playtime.riddles (by id)
    const riddlesArr = Array.isArray(playtime.riddles) ? playtime.riddles : [];
    const currentRiddleId = playtime.currentRiddle;
    const currentRiddleIndex =
      currentRiddleId != null
        ? riddlesArr.findIndex((r) => String(r._id) === String(currentRiddleId))
        : -1;

    // 5) only append a play entry if there is a current riddle to record
    let newPlayEntry: null | {
      riddleId: Id<"riddles">;
      done: true;
      playedBy: Id<"users">;
      turnIndex: number;
      result: "correct" | "incorrect" | "skipped" | "timedOut";
    } = null;

    if (currentRiddleIndex >= 0) {
      // pick the actual player who made the move:
      // prefer playtime.currentUser if present and still in the player list,
      // otherwise fall back to playerIds[currentUserIndex]
      const playedBy =
        currentUserId &&
        playerIds.some((id) => String(id) === String(currentUserId))
          ? currentUserId
          : playerIds[currentUserIndex];

      newPlayEntry = {
        riddleId: currentRiddleId as Id<"riddles">,
        done: true,
        playedBy,
        turnIndex: Array.isArray(playtime.play) ? playtime.play.length : 0,
        result: (result ?? "skipped") as
          | "correct"
          | "incorrect"
          | "skipped"
          | "timedOut",
      };
    }

    // 6) mark current riddle done in riddles array (if exists)
    const newRiddles = riddlesArr.map((r) => ({ ...r })); // shallow clone
    if (currentRiddleIndex >= 0) {
      newRiddles[currentRiddleIndex] = {
        ...newRiddles[currentRiddleIndex],
        done: true,
      };
    }

    // 7) compute next riddle pointers (start search from currentRiddleIndex+1)
    // If currentRiddleIndex is -1, computeRiddlePointersFromIndex will pick first not-done
    const nextStartIndex =
      currentRiddleIndex >= 0 ? currentRiddleIndex + 1 : null;
    const pointerObj = computeRiddlePointersFromIndex(
      newRiddles,
      nextStartIndex
    );

    // 8) prepare DB patch
    const playArray =
      newPlayEntry != null
        ? Array.isArray(playtime.play)
          ? playtime.play.concat([newPlayEntry])
          : [newPlayEntry]
        : playtime.play; // keep as-is if no new entry

    // previousUser should be undefined on the very first recorded play
    const previousUserToSet =
      playtime.currentUser &&
      playerIds.some((id) => String(id) === String(playtime.currentUser))
        ? playtime.currentUser
        : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = {
      riddles: newRiddles,
      play: playArray,
      previousUser: previousUserToSet,
      // rotate users only if there was a current riddle (i.e. we actually advanced a turn)
      currentUser:
        currentRiddleIndex >= 0
          ? playerIds[nextUserIndex]
          : playtime.currentUser,
      nextUser:
        currentRiddleIndex >= 0
          ? playerIds[(nextUserIndex + 1) % playerIds.length]
          : playtime.nextUser,
      previousRiddle: playtime.currentRiddle,
      currentRiddle: pointerObj.currentRiddle,
      nextRiddle: pointerObj.nextRiddle,
    };

    // 9) if there is no next riddle (finished), mark completed and stop playing
    if (!pointerObj.currentRiddle) {
      // patch.playing = false;
      patch.completed = true;
      patch.currentRiddle = undefined;
      patch.nextRiddle = undefined;
    }

    // 10) update DB
    // IMPORTANT: Use a transaction or conditional patch if your DB supports it to avoid races.
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
