import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

export const getAuthUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
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
