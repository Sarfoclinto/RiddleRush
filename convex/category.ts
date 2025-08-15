import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const cat = name.toLowerCase().trim();
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", cat))
      .unique();

    if (existing) {
      return existing._id;
    }
    const categoryId = ctx.db.insert("categories", { name: cat });
    return categoryId;
  },
});

export const getCategoryByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
  },
});

export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});
