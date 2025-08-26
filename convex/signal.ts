import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendSignal = mutation({
  args: {
    roomId: v.id("rooms"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    type: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice")),
    payload: v.any(),
  },
  handler: async (ctx, { fromUserId, payload, roomId, toUserId, type }) => {
    const now = Date.now();

    // Basic validation: ensure the type is allowed
    if (!["offer", "answer", "ice"].includes(type)) {
      throw new Error("Invalid signal type");
    }

    // Validate that both fromUserId and toUserId are present in the room (and online)
    // We use the presence table to check membership/online.
    const fromPres = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", fromUserId).eq("roomId", roomId)
      )
      .first();

    const toPres = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", toUserId).eq("roomId", roomId)
      )
      .first();

    if (!fromPres) {
      throw new Error("Sender not present in room");
    }
    if (!toPres) {
      throw new Error("Recipient not present in room");
    }

    // Insert signal
    await ctx.db.insert("webrtcSignals", {
      roomId,
      fromUserId,
      toUserId,
      type,
      payload,
      createdAt: now,
    });

    return { ok: true };
  },
});

// TTL for signals in milliseconds (e.g. 60s)
const SIGNAL_TTL_MS = 60 * 1000;

export const listForUser = query({
  args: {
    roomId: v.id("rooms"),
    toUserId: v.id("users"),
    since: v.optional(v.number()),
  },
  handler: async (ctx, { roomId, toUserId, since }) => {
    const cusSince = since ? since : 0;
    // return signals addressed to this user in this room, newer than `since`
    const signals = await ctx.db
      .query("webrtcSignals")
      .withIndex("by_to", (q) =>
        q.eq("toUserId", toUserId).eq("roomId", roomId)
      )
      .collect();

    // filter by since and TTL server-side
    const now = Date.now();
    const filtered = signals.filter(
      (s) => s.createdAt >= cusSince && now - s.createdAt <= SIGNAL_TTL_MS
    );

    // Sort ascending by createdAt for predictable ordering
    filtered.sort((a, b) => a.createdAt - b.createdAt);

    return filtered;
  },
});

export const deleteSignal = mutation({
  args: {
    signalId: v.id("webrtcSignals"),
  },
  handler: async (ctx, { signalId }) => {
    await ctx.db.delete(signalId);
    return { ok: true };
  },
});

export const listPresenceInRoom = query({
  args: {
    id: v.id("rooms"),
  },
  handler: async (ctx, { id }) => {
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", id))
      .collect();

    return rows;
  },
});

export const cleanupOldSignals = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - SIGNAL_TTL_MS;
    // Collect signals older than cutoff
    // Note: for large tables, implement batching or set up a scheduled cleanup.
    const stale = await ctx.db.query("webrtcSignals").collect();

    const staleIds = stale
      .filter((s) => s.createdAt < cutoff)
      .map((s) => s._id);

    for (const id of staleIds) {
      await ctx.db.delete(id);
    }
    return { deleted: staleIds.length };
  },
});
