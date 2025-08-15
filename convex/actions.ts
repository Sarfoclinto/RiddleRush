"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const createPlaytime = action({
  args: {
    username: v.string(),
    numberOfRiddles: v.number(),
    category: v.string(),
    timeSpan: v.number(),
  },
  handler: async (
    ctx,
    { category, timeSpan, username, numberOfRiddles }
  ): Promise<Id<"playtimes">> => {
    const userId = await ctx.runMutation(api.users.createUserByUsername, {
      username,
    });
    const catId = await ctx.runMutation(api.category.saveCategory, {
      name: category,
    });

    const riddles = await ctx.runAction(api.playtime.getRiddles, {
      category,
      numberOfRiddles,
    });

    // loop through riddles and save them returning their ids
    const riddleIds = await Promise.all(
      (riddles as Array<{ riddle: string; answer: string }>).map(async (r) => {
        const riddleId = await ctx.runMutation(api.riddles.saveRiddle, {
          riddle: {
            text: r.riddle,
            answer: r.answer,
            category: catId,
          },
        });
        return riddleId;
      })
    );

    // Convert riddle IDs to the format expected by the schema
    const riddleObjects = riddleIds.map((id) => ({
      _id: id,
    }));

    const playtimeId = await ctx.runMutation(api.playtime.savePlaytime, {
      playtime: {
        userId,
        riddles: riddleObjects,
        secondsPerRiddle: timeSpan,
      },
    });
    return playtimeId;
  },
});
