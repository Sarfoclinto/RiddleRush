import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// import { api } from "./_generated/api";
import { computePointersFromIndex } from "./utils/fns";

export const savePlaytime = mutation({
  args: {
    playtime: v.object({
      userId: v.id("users"),
      riddles: v.array(v.object({ _id: v.id("riddles") })),
      secondsPerRiddle: v.number(),
    }),
  },
  handler: async (ctx, { playtime }) => {
    const riddles = playtime.riddles.map((r) => ({ ...r, done: false }));

    // find the first not-done (usually 0)
    const firstIdx = riddles.findIndex((r) => !r.done);
    const { current, previous, next } = computePointersFromIndex(
      riddles,
      firstIdx === -1 ? null : firstIdx
    );
    const payload = {
      userId: playtime.userId,
      riddles: riddles,
      corrects: undefined,
      incorrects: undefined,
      skipped: undefined,
      playing: true,
      current,
      previous,
      next,
      secondsPerRiddle: playtime.secondsPerRiddle,
    };
    return await ctx.db.insert("playtimes", payload);
  },
});

export const getPlaytimeById = query({
  args: { id: v.id("playtimes") },
  handler: async (ctx, { id }) => {
    const playtime = await ctx.db.get(id);
    if (!playtime) {
      throw new Error("Playtime not found");
    }
    const user = await ctx.db.get(playtime?.userId);
    return { ...playtime, user };
  },
});

export const advancePlaytime = mutation({
  args: {
    playtimeId: v.id("playtimes"),
    result: v.union(
      v.literal("correct"),
      v.literal("incorrect"),
      v.literal("skipped")
    ),
  },
  handler: async (ctx, { playtimeId, result }) => {
    const playtime = await ctx.db.get(playtimeId);
    if (!playtime) {
      throw new Error("Playtime not found");
    }

    // find current index by id
    const currentId = playtime.current;
    let currentIndex = -1;
    if (currentId) {
      currentIndex = playtime.riddles.findIndex(
        (r) => (r._id as string) === currentId
      );
    }

    // if no explicit current, compute first undone
    if (currentIndex === -1) {
      currentIndex = playtime.riddles.findIndex((r) => !r.done);
      if (currentIndex === -1) {
        return await ctx.db.patch(playtimeId, { playing: false });
      }
    }

    //  mark current done
    // playtime.riddles[currentIndex].done = true;

    // mark current done
    const updatedRiddles = [...playtime.riddles];
    updatedRiddles[currentIndex] = {
      ...updatedRiddles[currentIndex],
      done: true,
    };

    // push into appropriate bucket - convert ID to string
    const riddleId = playtime.riddles[currentIndex]._id as string;
    let updatedCorrects = playtime.corrects || [];
    let updatedIncorrects = playtime.incorrects || [];
    let updatedSkipped = playtime.skipped || [];

    if (result === "correct") {
      updatedCorrects = [...updatedCorrects, riddleId];
    } else if (result === "incorrect") {
      updatedIncorrects = [...updatedIncorrects, riddleId];
    } else {
      updatedSkipped = [...updatedSkipped, riddleId];
    }

    // advance index to next not-done after currentIndex
    let nextIndex = currentIndex + 1;
    while (
      nextIndex < updatedRiddles.length &&
      updatedRiddles[nextIndex].done
    ) {
      nextIndex++;
    }
    const nextIdxOrNull = nextIndex < updatedRiddles.length ? nextIndex : null;

    const { previous, current, next } = computePointersFromIndex(
      updatedRiddles,
      nextIdxOrNull
    );
    const updatePayload = {
      riddles: updatedRiddles,
      corrects: updatedCorrects,
      incorrects: updatedIncorrects,
      skipped: updatedSkipped,
      previous,
      current,
      next,
      playing: nextIdxOrNull !== null,
    };

    return await ctx.db.patch(playtimeId, updatePayload);
  },
});

export const getPlaytimeRiddlesDetails = query({
  args: { id: v.id("playtimes") },
  handler: async (ctx, { id }) => {
    const playtime = await ctx.db.get(id);
    if (!playtime) {
      throw new Error("Playtime not found");
    }

    const details = Promise.all(
      playtime.riddles.map(async (r) => {
        const riddle = await ctx.db.get(r._id);
        return riddle;
      })
    );
    return details;
  },
});
