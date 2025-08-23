"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { makeTypo, morphologicalVariant, shuffle } from "./utils/riddleFns";

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

    const riddles = await ctx.runAction(api.riddles.getRiddles, {
      category,
      numberOfRiddles,
    });

    // loop through riddles and save them returning their ids
    const riddleIds = await Promise.all(
      (riddles as Array<{ riddle: string; answer: string }>).map(async (r) => {
        const riddleId = await ctx.runAction(api.riddles.saveRiddle, {
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

export const fetchRelatedWordsDatamuse = action({
  args: {
    word: v.string(),
    max: v.number(),
  },
  handler: async (_, { word, max = 6 }): Promise<string[]> => {
    try {
      const resp = await fetch(
        `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=${max}`
      );
      if (!resp.ok) return [];
      const data: Array<{ word: string }> = await resp.json();
      return data.map((d) => d.word);
    } catch {
      return [];
    }
  },
});

export const generateDistractors = action({
  args: { answer: v.string(), count: v.number() },
  handler: async (ctx, { answer, count = 3 }): Promise<string[]> => {
    const norm = answer.trim();
    const s = new Set<string>();
    s.add(makeTypo(norm));
    s.add(morphologicalVariant(norm));
    const related = await ctx.runAction(api.actions.fetchRelatedWordsDatamuse, {
      word: answer,
      max: Math.max(6, count * 2),
    });
    for (const r of related) {
      if (s.size >= count + 1) break;
      if (r.toLowerCase() === norm.toLowerCase()) continue;
      s.add(r);
    }
    while (s.size < count + 1) {
      let candidate = "";
      const vowels = "aeiou";
      for (let i = 0; i < Math.max(1, norm.length); i++) {
        candidate +=
          Math.random() > 0.6
            ? vowels[Math.floor(Math.random() * vowels.length)]
            : String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
      s.add(candidate);
    }
    s.delete(norm);
    const arr = Array.from(s).slice(0, count);
    return shuffle(arr);
  },
});

export const loadRoomRiddles = action({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const res = await ctx.runQuery(api.rooms.getRoomById, {
      id: roomId,
    });
    const room = res?.room;
    const settings = res?.settings;

    if (!room) {
      throw new Error("Room not found");
    }
    const riddles = await ctx.runAction(api.riddles.getRiddles, {
      category: settings?.categoryName,
      numberOfRiddles: settings?.numberOfRiddles || 0,
    });

    // loop through riddles and save them returning their ids
    const riddleIds = await Promise.all(
      (riddles as Array<{ riddle: string; answer: string }>).map(async (r) => {
        const riddleId = await ctx.runAction(api.riddles.saveRiddle, {
          riddle: {
            text: r.riddle,
            answer: r.answer,
            category: settings.riddlesCategory,
          },
        });
        return riddleId;
      })
    );

    // Convert riddle IDs to the format expected by the schema
    const riddleObjects = riddleIds.map((id) => ({
      _id: id,
    }));

    const playtimeId = await ctx.runMutation(
      api.roomPlaytime.createRoomPlaytime,
      {
        roomId,
        riddles: riddleObjects,
      }
    );

    await ctx.runMutation(api.rooms.updateRoomPlaytimeId, {
      roomPlaytimeId: playtimeId,
      roomId,
    });
  },
});
