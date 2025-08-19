import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.optional(v.string()),
    fullname: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    image: v.optional(v.string()),
  })
    .index("by_username", ["username"])
    .index("by_clerkId", ["clerkId"]),

  riddles: defineTable({
    text: v.string(),
    hash: v.string(),
    answer: v.string(),
    choices: v.optional(v.array(v.string())),
    category: v.string(),
    difficulty: v.optional(v.string()),
  })
    .index("by_hash", ["hash"])
    .index("by_text", ["text"]),

  playtimes: defineTable({
    userId: v.id("users"),
    riddles: v.array(v.object({ _id: v.id("riddles"), done: v.boolean() })),
    corrects: v.optional(v.array(v.string())),
    incorrects: v.optional(v.array(v.string())),
    skipped: v.optional(v.array(v.string())),
    playing: v.boolean(),
    completed: v.optional(v.boolean()),
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

  rooms: defineTable({
    code: v.string(),
    name: v.optional(v.string()),
    hostId: v.id("users"),
    status: v.union(v.literal("public"), v.literal("private")),
    maxPlayers: v.number(),
    playtimeId: v.optional(v.id("roomPlaytimes")),
    startUser: v.optional(v.id("users")),
    playing: v.boolean(),
    playersCount: v.optional(v.number()), // denormalized
  })
    .index("by_status", ["status"])
    .index("by_user", ["hostId"])
    .index("by_user_code", ["code", "hostId"])
    .index("by_playtime", ["playtimeId"]),

  roomSettings: defineTable({
    roomId: v.id("rooms"),
    numberOfRiddles: v.number(),
    riddlesCategory: v.id("categories"),
    riddleTimeSpan: v.number(),
    skipBehaviour: v.union(v.literal("new"), v.literal("pass")),
  }).index("by_roomId", ["roomId"]),

  roomPlaytimes: defineTable({
    roomId: v.id("rooms"),
    riddles: v.array(v.object({ _id: v.id("riddles"), done: v.boolean() })),
    play: v.optional(
      v.array(
        v.object({
          riddleId: v.id("riddles"),
          done: v.boolean(),
          playedBy: v.id("users"),
          turnIndex: v.number(),
          result: v.union(
            v.literal("correct"),
            v.literal("incorrect"),
            v.literal("skipped")
          ),
        })
      )
    ),

    completed: v.optional(v.boolean()),

    currentRiddle: v.optional(v.id("riddles")),
    previousRiddle: v.optional(v.id("riddles")),
    nextRiddle: v.optional(v.id("riddles")),

    currentUser: v.optional(v.id("users")),
    startUser: v.optional(v.id("users")),
    previousUser: v.optional(v.id("users")),
    nextUser: v.optional(v.id("users")),
  })
    .index("by_current", ["currentRiddle", "currentUser"])
    .index("by_room", ["roomId"]),

  roomPlayers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    ready: v.optional(v.boolean()),
    joinIndex: v.optional(v.number()),
  }).index("by_roomId", ["roomId", "userId"]),

  roomRequests: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  })
    .index("by_roomId", ["roomId", "userId"])
    .index("by_userId", ["userId", "roomId"]),

  notification: defineTable({
    creator: v.id("users"),
    reciever: v.id("users"),
    type: v.union(v.literal("request"), v.literal("accepted")),
  })
    .index("by_creator", ["creator"])
    .index("by_reciever", ["reciever"]),
});
