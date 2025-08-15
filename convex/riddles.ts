import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { hashString } from "./utils/fns";
import type { Doc, Id } from "./_generated/dataModel";
import { shuffle } from "./utils/riddleFns";
import { api } from "./_generated/api";
// import { Id } from "./_generated/dataModel";

export const saveRiddle = action({
  args: {
    riddle: v.object({
      text: v.string(),
      answer: v.string(),
      category: v.string(),
    }),
  },
  handler: async (ctx, { riddle }): Promise<Id<"riddles">> => {
    const hash = await hashString(riddle.text);
    const existing: Doc<"riddles"> | null = await ctx.runQuery(
      api.riddles.getRiddleByHash,
      { hash }
    );

    if (existing) {
      return existing._id;
    } else {
      const answerRaw = riddle?.answer;
      const answerStr =
        answerRaw == null
          ? ""
          : Array.isArray(answerRaw)
            ? String(answerRaw[0] ?? "")
            : String(answerRaw);

      if (!answerRaw) {
        throw new Error("Riddle answer is required");
      }
      const distractors: string[] = await ctx.runAction(
        api.actions.generateDistractors,
        {
          answer: answerStr,
          count: 3,
        }
      );
      const mixed = shuffle([answerStr, ...distractors]);
      const riddleId: Id<"riddles"> = await ctx.runMutation(
        api.riddles.insertRiddles,
        {
          riddle: {
            text: riddle.text,
            hash,
            answer: riddle.answer,
            choices: mixed,
            category: riddle.category,
          },
        }
      );
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

export const getRiddles = action({
  args: { category: v.string(), numberOfRiddles: v.number() },
  handler: async (_, { category, numberOfRiddles }) => {
    const res = await fetch(
      `https://riddles-api-eight.vercel.app/${category}/${numberOfRiddles}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch riddles");
    }
    const riddles = await res.json();
    return riddles?.riddlesArray;
  },
});

export const getRiddleByHash = query({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    const riddle = await ctx.db
      .query("riddles")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .unique();
    return riddle;
  },
});

export const insertRiddles = mutation({
  args: {
    riddle: v.object({
      text: v.string(),
      hash: v.string(),
      answer: v.string(),
      choices: v.optional(v.array(v.string())),
      category: v.string(),
      difficulty: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { riddle }) => {
    return await ctx.db.insert("riddles", riddle);
  },
});
