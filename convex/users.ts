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
