import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./users";

export const updatePresence = mutation({
  args: {
    roomId: v.id("rooms"),
    isOnline: v.optional(v.boolean()),
    isSpeaking: v.optional(v.boolean()),
    micEnabled: v.optional(v.boolean()),
    speakerEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    const updates = {
      lastSeen: Date.now(),
      ...(args.isOnline !== undefined && { isOnline: args.isOnline }),
      ...(args.isSpeaking !== undefined && { isSpeaking: args.isSpeaking }),
      ...(args.micEnabled !== undefined && { micEnabled: args.micEnabled }),
      ...(args.speakerEnabled !== undefined && {
        speakerEnabled: args.speakerEnabled,
      }),
    };

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, updates);
    } else {
      await ctx.db.insert("presence", {
        roomId: args.roomId,
        userId: user._id,
        isOnline: args.isOnline ?? true,
        isSpeaking: args.isSpeaking ?? false,
        micEnabled: args.micEnabled ?? false,
        speakerEnabled: args.speakerEnabled ?? true,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getRoomPresence = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const presenceWithUsers = await Promise.all(
      presence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user: user
            ? {
                name: user.username || user.email || "Unknown",
                email: user.email,
                _id: user._id,
              }
            : null,
        };
      })
    );

    return presenceWithUsers.filter((p) => p.user && p.isOnline);
  },
});

export const toggleMicrophone = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    if (presence) {
      await ctx.db.patch(presence._id, {
        micEnabled: !presence.micEnabled,
        isSpeaking: false, // Stop speaking when toggling mic
        lastSeen: Date.now(),
      });
      return !presence.micEnabled;
    }
    return false;
  },
});

export const toggleSpeaker = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    if (presence) {
      await ctx.db.patch(presence._id, {
        speakerEnabled: !presence.speakerEnabled,
        lastSeen: Date.now(),
      });
      return !presence.speakerEnabled;
    }
    return true;
  },
});
