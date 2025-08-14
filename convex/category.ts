import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
