import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashString } from "./utils/fns";
import type { Id } from "./_generated/dataModel";
// import { Id } from "./_generated/dataModel";

export const saveRiddle = mutation({
  args: {
    riddle: v.object({
      text: v.string(),
      answer: v.string(),
      choices: v.optional(v.array(v.string())),
      category: v.string(),
      difficulty: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { riddle }) => {
    const hash = await hashString(riddle.text);
    const existing = await ctx.db
      .query("riddles")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .unique();

    if (existing) {
      return existing._id;
    } else {
      const riddleId = ctx.db.insert("riddles", { ...riddle, hash });
      return riddleId;
    }
  },
});

export const getRiddleById = query({
  args: { id: v.id("riddles") },
  handler: async (ctx, { id }) => {
    const riddle = await ctx.db.get(id);
    return riddle;
  },
});

export const getRiddleByStringId = query({
  args: { stringId: v.string() },
  handler: async (ctx, { stringId }) => {
    const riddleId = stringId as Id<"riddles">;
    // const riddle = await ctx.db
    //   .query("riddles")
    //   .filter((q) => q.eq("_id", stringId))
    //   .first();
    const riddle = await ctx.db.get(riddleId);
    return riddle;
  },
});
