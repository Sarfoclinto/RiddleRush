import { v } from "convex/values";
import {
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from "./_generated/server";

export const getAuthUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  // Fetch the current user
  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!currentUser) {
    throw new Error("User not found: Unable to fetch auth user.");
  }

  return currentUser;
};

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    return user;
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    return user;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, { clerkId }) => {
    if (!clerkId) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    return user;
  },
});

export const createUserByUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const useName = username.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", useName))
      .unique();
    if (existing) {
      return existing._id;
    } else {
      const userId = ctx.db.insert("users", { username: useName });
      return userId;
    }
  },
});

export const createClerkUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    image: v.string(),
    fullname: v.string(),
    username: v.string(),
  },
  handler: async (ctx, { clerkId, email, fullname, image, username }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) return;

    const userId = ctx.db.insert("users", {
      clerkId: clerkId,
      email: email,
      image: image,
      fullname: fullname,
      username: username,
    });
    return userId;
  },
});

export const setPlayerReady = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    ready: v.boolean(),
  },
  handler: async (ctx, { roomId, userId, ready }) => {
    // find the player row
    const rows = await ctx.db
      .query("roomPlayers")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    if (rows.length === 0) throw new Error("Player not in room");
    const row = rows[0];

    await ctx.db.patch(row._id, { ready });

    // return snapshot for client convenience
    const players = await ctx.db
      .query("roomPlayers")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .collect();

    return {
      ok: true,
      players: players.map((p) => ({ userId: p.userId, ready: !!p.ready })),
    };
  },
});

export const myRooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("User not found");
    // console.log("user found")
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_user", (q) => q.eq("hostId", user._id))
      .collect();

    // sort rooms such that the recently created(_creationTime) comes first
    rooms.sort((a, b) => b._creationTime - a._creationTime);
    return rooms;
  },
});

export const requestRoom = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await getAuthUser(ctx);
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_user_code", (q) => q.eq("code", code))
      .first();
    if (!room) return { ok: false, message: "Room not found" };

    const existing = await ctx.db
      .query("roomRequests")
      .withIndex("by_userId", (q) =>
        q.eq("userId", user._id).eq("roomId", room._id)
      )
      .first();
    if (existing) {
      return {
        ok: false,
        message: "You have already requested this room",
      };
    }

    if (room.hostId === user._id) {
      return { ok: false, message: "You own the room already" };
    }

    await ctx.db.insert("roomRequests", {
      roomId: room._id,
      status: "pending",
      userId: user._id,
    });

    await ctx.db.insert("notification", {
      creator: user._id,
      reciever: room.hostId,
      type: "request",
      read: false,
      roomId: room._id,
    });

    return { ok: true, message: "Room request sent" };
  },
});
