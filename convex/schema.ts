import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    image: v.optional(v.string()),
  }).index("by_username", ["username"]),

  riddles: defineTable({
    text: v.string(),
    hash: v.string(),
    answer: v.string(),
    choices: v.optional(v.array(v.string())),
    category: v.string(),
    difficulty: v.optional(v.string()),
  }).index("by_hash", ["hash"]),

  playtimes: defineTable({
    userId: v.id("users"),
    riddles: v.array(v.object({ _id: v.id("riddles"), done: v.boolean() })),
    corrects: v.optional(v.array(v.string())),
    incorrects: v.optional(v.array(v.string())),
    skipped: v.optional(v.array(v.string())),
    playing: v.boolean(),
    secondsPerRiddle: v.number(),
    current: v.optional(v.string()), //v.optional(v.id("riddles")),
    previous: v.optional(v.string()), //v.optional(v.id("riddles")),
    next: v.optional(v.string()), //v.optional(v.id("riddles")),
  })
    .index("by_current", ["current"])
    .index("by_previous", ["previous"])
    .index("by_next", ["next"])
    .index("by_user_playing", ["userId", "playing"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
});
