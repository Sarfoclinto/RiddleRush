import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./users";

export const getMyUnreadNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    const notifications = await ctx.db
      .query("notification")
      .withIndex("by_reciever", (q) => q.eq("reciever", user._id))
      .collect();

    const filtered = notifications.filter((not) => !not.read);
    return filtered.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const notificationsAndDetails = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    const notifications = await ctx.db
      .query("notification")
      .withIndex("by_reciever", (q) => q.eq("reciever", user._id))
      .collect();

    const filtered = notifications.filter((not) => !not.read);

    const withDetials = await Promise.all(
      filtered.map(async (nt) => {
        const sender = await ctx.db.get(nt.creator);
        const room = nt.roomId ? await ctx.db.get(nt.roomId) : undefined;
        // const receiver = await ctx.db.get(nt.reciever);

        return {
          ...nt,
          creatorDetails: { username: sender?.username, image: sender?.image },
          roomName: room ? room?.name : undefined,
          roomCode: room ? room.code : undefined,
        };
      })
    );

    return withDetials;
  },
});

export const readNotification = mutation({
  args: { id: v.id("notification") },
  handler: async (ctx, { id }) => {
    // const user = await getAuthUser(ctx);
    await ctx.db.patch(id, { read: true });
  },
});
