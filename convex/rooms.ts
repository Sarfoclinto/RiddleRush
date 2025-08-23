import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateRoomCode } from "./utils/fns";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getAuthUser } from "./users";

export const createRoom = mutation({
  args: {
    name: v.optional(v.string()),
    status: v.union(v.literal("public"), v.literal("private")),
    maxPlayers: v.number(),
  },
  handler: async (ctx, { maxPlayers, status, name }) => {
    let code: string;
    let existing: {
      _id: Id<"rooms">;
      _creationTime: number;
      name?: string | undefined;
      code: string;
      hostId: Id<"users">;
      status: "public" | "private";
      maxPlayers: number;
    } | null;
    const user = await getAuthUser(ctx);

    // Keep generating until no duplicate is found
    do {
      code = await generateRoomCode({ length: 7, prefix: "RR-" });
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_user_code", (q) =>
          q.eq("code", code).eq("hostId", user._id)
        )
        .first();
    } while (existing);

    const roomId = await ctx.db.insert("rooms", {
      maxPlayers,
      status,
      name,
      hostId: user._id,
      code,
      playing: false,
    });

    await ctx.db.insert("roomPlayers", {
      roomId: roomId,
      userId: user._id,
      ready: true,
      joinIndex: 0,
    });

    return roomId;
  },
});

export const createRoomSettings = mutation({
  args: {
    room: v.id("rooms"),
    numberOfRiddles: v.number(),
    riddleTimeSpan: v.number(),
    riddlesCategory: v.string(),
    skipBehaviour: v.union(v.literal("new"), v.literal("pass")),
  },
  handler: async (
    ctx,
    { room, numberOfRiddles, riddleTimeSpan, skipBehaviour, riddlesCategory }
  ) => {
    try {
      const fetchRoom = ctx.db.get(room);
      if (!fetchRoom) {
        throw new Error("Room not found");
      }
      const catId = await ctx.runMutation(api.category.saveCategory, {
        name: riddlesCategory,
      });
      await ctx.db.insert("roomSettings", {
        roomId: room,
        numberOfRiddles,
        riddleTimeSpan,
        skipBehaviour,
        riddlesCategory: catId,
      });
      return fetchRoom;
    } catch (err) {
      throw new Error(String(err));
    }
  },
});

export const getRoomById = query({
  args: {
    id: v.id("rooms"),
    roomPlaytimeId: v.optional(v.id("roomPlaytimes")),
  },
  handler: async (ctx, { id, roomPlaytimeId }) => {
    const room = await ctx.db.get(id);
    if (!room) {
      throw new Error("Room not found");
    }
    if (roomPlaytimeId) {
      if (room.playtimeId !== roomPlaytimeId) {
        throw new Error("Room playtime mismatch");
      }
    }
    const host = await ctx.db.get(room?.hostId);
    if (!host) {
      throw new Error("User not found");
    }
    const user = await getAuthUser(ctx);
    const roomSettings = await ctx.db
      .query("roomSettings")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .first();
    if (!roomSettings) {
      throw new Error("Room settings not found");
    }

    const roomPlaytime = await ctx.db.get(room.playtimeId!);

    const readyPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_ready", (q) => q.eq("roomId", room._id).eq("ready", true))
      .collect();

    const accpetedPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_ready", (q) => q.eq("roomId", room._id))
      .collect();

    const category = await ctx.db.get(roomSettings?.riddlesCategory);
    // return { ...room, user };
    return {
      room,
      settings: { ...roomSettings, categoryName: category?.name },
      host,
      user,
      roomPlaytime,
      readyPlayers: readyPlayers.length,
      acceptedPlayers: accpetedPlayers.length,
    };
  },
});

export const getRoom = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, { id }) => {
    const room = await ctx.db.get(id);
    if (!room) {
      throw new Error("Room not found");
    }

    const readyPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_ready", (q) => q.eq("roomId", room._id).eq("ready", true))
      .collect();
    const accpetedPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_ready", (q) => q.eq("roomId", room._id))
      .collect();
    return {
      ...room,
      readyPlayers: readyPlayers.length,
      acceptedPlayers: accpetedPlayers.length,
    };
  },
});

export const roomSetting = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, { id }) => {
    const room = await ctx.db.get(id);
    if (!room) {
      throw new Error("Room not found");
    }

    const settings = await ctx.db
      .query("roomSettings")
      .withIndex("by_roomId", (q) => q.eq("roomId", id))
      .first();

    if (!settings) {
      throw new Error("Room settings not found");
    }

    const category = await ctx.db.get(settings?.riddlesCategory);
    return {
      room,
      settings: { ...settings, categoryName: category?.name },
    };
  },
});

export const updateRoomPlaytimeId = mutation({
  args: {
    roomPlaytimeId: v.id("roomPlaytimes"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, { roomPlaytimeId, roomId }) => {
    const roomPlaytime = await ctx.db.get(roomPlaytimeId);
    if (!roomPlaytime) {
      throw new Error("Room playtime not found");
    }
    if (roomPlaytime.roomId !== roomId) {
      throw new Error("Room playtime does not belong to the specified room");
    }
    await ctx.db.patch(roomId, { playtimeId: roomPlaytimeId });
  },
});

export const acceptRoomRequest = mutation({
  args: {
    // requestId: v.id("roomRequests"),
    // roomId: v.id("rooms"),
    // creatorId: v.id("users"),
    notificationId: v.id("notification"),
  },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);
    const user = await getAuthUser(ctx);

    if (!notification) throw new Error("Notification not found");

    if (notification.type !== "request") {
      throw new Error("Notification is not a join request");
    }

    if (notification.roomRequestId) {
      const roomRequest = await ctx.db.get(notification.roomRequestId);
      if (!roomRequest) throw new Error("Room request not found");

      const room = await ctx.db.get(roomRequest.roomId);
      if (!room) throw new Error("Room not found");

      // security: only room host can accept
      if (String(room.hostId) !== String(user._id)) {
        throw new Error("Only host can accept join requests");
      }

      // mark the request as accepted
      await ctx.db.patch(roomRequest._id, { status: "accepted" });

      // 2) compute joinIndex (count existing players)
      const existing = await ctx.db
        .query("roomPlayers")
        .filter((q) => q.eq(q.field("roomId"), roomRequest.roomId))
        .collect();
      const joinIndex = existing.length;

      // 3) insert into roomPlayers
      const newPlayer = {
        roomId: roomRequest.roomId,
        userId: roomRequest.userId,
        ready: false,
        joinIndex,
      };
      await ctx.db.insert("roomPlayers", newPlayer);

      // 4) recompute random startUser among current players
      const playersAfterInsert = existing.concat([
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _id: undefined as any, // placeholder, since the new player is not yet in DB
          _creationTime: Date.now(), // or 0 as a placeholder
          ready: false,
          joinIndex,
          userId: roomRequest.userId,
          roomId: roomRequest.roomId,
        },
      ]);
      const playerIds = playersAfterInsert.map((p) => p.userId);
      // choose random index
      const randIndex = Math.floor(Math.random() * playerIds.length);
      const newStartUser = playerIds[randIndex];

      // 5) persist to room.startUser so the host's future "Start" uses it
      await ctx.db.patch(roomRequest.roomId, { startUser: newStartUser });

      await ctx.db.insert("notification", {
        creator: user._id,
        reciever: roomRequest.userId,
        read: false,
        type: "accepted",
        roomId: roomRequest.roomId,
      });

      await ctx.db.patch(notificationId, { read: true });

      return {
        ok: true,
        acceptedUser: roomRequest.userId,
        startUser: newStartUser,
      };
    } else {
      throw new Error("Notification does not have a roomRequestId");
    }
  },
});

export const rejectRoomRequest = mutation({
  args: {
    // requestId: v.id("roomRequests"),
    // hostUserId: v.id("users"),
    notificationId: v.id("notification"),
  },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);
    const user = await getAuthUser(ctx);

    if (!notification) throw new Error("Notification not found");

    if (notification.type !== "request") {
      throw new Error("Notification is not a join request");
    }

    if (notification.roomRequestId) {
      const roomRequest = await ctx.db.get(notification.roomRequestId);
      if (!roomRequest) throw new Error("Room request not found");

      const room = await ctx.db.get(roomRequest.roomId);
      if (!room) throw new Error("Room not found");

      // security: only room host can accept
      if (String(room.hostId) !== String(user._id)) {
        throw new Error("Only host can accept join requests");
      }

      // mark the request as accepted
      // or you can delete
      // await ctx.db.patch(roomRequest._id, { status: "rejected" });
      await ctx.db.delete(roomRequest._id);

      await ctx.db.insert("notification", {
        creator: user._id,
        reciever: roomRequest.userId,
        read: false,
        type: "reject",
        roomId: roomRequest.roomId,
      });

      await ctx.db.patch(notificationId, { read: true });
      return { ok: true, rejectedUser: roomRequest.userId };
    } else {
      throw new Error("Notification does not have a roomRequestId");
    }
  },
});

export const getRoomPlayers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    const user = await getAuthUser(ctx);
    if (!room) {
      throw new Error("Room not found");
    }
    if (!user) {
      throw new Error("User not found");
    }
    const players = await ctx.db
      .query("roomPlayers")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .collect();

    const playerDetials = await Promise.all(
      players.map(async (pl) => {
        const user = await ctx.db.get(pl.userId);
        return {
          ...pl,
          user,
          ishost: user !== null ? user._id == room.hostId : false,
        };
      })
    );

    // remove self
    const filtered = playerDetials.filter((pl) => pl.user?._id !== user._id);
    return filtered;
  },
});

export const getPublicRooms = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    // 1) fetch public rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "public"))
      .collect();

    const roomsWithPlaytime = rooms.filter((r) => !!r.playtimeId);
    if (roomsWithPlaytime.length === 0) return [];

    // 2) Compute noOfPlayers:
    //    - use room.playersCount when present
    //    - otherwise, count roomPlayers for that room (in parallel for the subset)
    const countsByRoom = new Map<string, number>();
    const roomsMissingCount = rooms.filter((r) => r.playersCount == null);

    // For rooms with denormalized playersCount, use that
    for (const r of rooms) {
      if (typeof r.playersCount === "number") {
        countsByRoom.set(r._id, r.playersCount);
      }
    }

    // For rooms missing playersCount, count via roomPlayers (parallel)
    if (roomsMissingCount.length > 0) {
      const missingCounts = await Promise.all(
        roomsMissingCount.map(async (room) => {
          const players = await ctx.db
            .query("roomPlayers")
            .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
            .collect();
          return { roomId: room._id, count: players.length };
        })
      );
      missingCounts.forEach((c) => countsByRoom.set(c.roomId, c.count));
    }

    // 3) Fetch user's requests for these rooms.
    // Try to fetch in bulk using an index 'by_userId' (fast). If that index
    // doesn't exist, fall back to per-room parallel queries.
    const requestStatusByRoom = new Map<string, string>();

    const roomIds = rooms.map((r) => r._id);

    try {
      // bulk fetch: all requests for this user (requires index "by_userId")
      const allUserRequests = await ctx.db
        .query("roomRequests")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      for (const req of allUserRequests) {
        // only care about requests that belong to rooms in our list
        if (roomIds.includes(req.roomId)) {
          requestStatusByRoom.set(req.roomId, req.status);
        }
      }

      // mark any rooms without a request as "none"
      for (const id of roomIds) {
        if (!requestStatusByRoom.has(id)) requestStatusByRoom.set(id, "none");
      }
    } catch (err) {
      // likely the 'by_userId' index does not exist; fall back to per-room queries
      console.error(err);
      const perRoom = await Promise.all(
        rooms.map(async (room) => {
          const req = await ctx.db
            .query("roomRequests")
            .withIndex("by_roomId", (q) =>
              q.eq("roomId", room._id).eq("userId", user._id)
            )
            .first();
          return { roomId: room._id, status: req?.status ?? "none" };
        })
      );
      perRoom.forEach((r) => requestStatusByRoom.set(r.roomId, r.status));
    }

    // 4) Build result: remove any playtime references (none needed), include playing & noOfPlayers & request
    const result = rooms.map((room) => {
      return {
        _id: room._id,
        code: room.code,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        maxPlayers: room.maxPlayers,
        startUser: room.startUser,
        // playing is now on the room itself
        playing: !!room.playing,
        ishost: room.hostId === user._id,
        noOfPlayers: countsByRoom.get(room._id) ?? 0,
        request: requestStatusByRoom.get(room._id) ?? "none",
      };
    });

    return result;
  },
});

export const quitRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await getAuthUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const avails = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", roomId).eq("userId", user._id)
      )
      .collect();

    const availsReq = await ctx.db
      .query("roomRequests")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id)
      )
      .collect();

    await Promise.all(
      availsReq.map(async (pl) => {
        await ctx.db.delete(pl._id);
      })
    );

    await Promise.all(
      avails.map(async (pl) => {
        await ctx.db.delete(pl._id);
      })
    );

    await ctx.db.insert("notification", {
      creator: user._id,
      reciever: room.hostId,
      read: false,
      type: "quit",
      roomId: roomId,
    });
  },
});

export const removeUserFromRoom = mutation({
  args: { roomId: v.id("rooms"), userId: v.id("users") },
  handler: async (ctx, { roomId, userId }) => {
    const user = await getAuthUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (user._id !== room.hostId) {
      throw new Error("Only room host can remove users");
    }

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .collect();

    const reqs = await ctx.db
      .query("roomRequests")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", room._id).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    await Promise.all(
      reqs.map(async (rq) => {
        await ctx.db.patch(rq._id, { status: "removed" });
      })
    );

    await Promise.all(
      players.map(async (pl) => {
        await ctx.db.delete(pl._id);
      })
    );

    await ctx.db.insert("notification", {
      creator: room.hostId,
      reciever: userId,
      read: false,
      type: "removed",
      roomId: roomId,
    });
    return { ok: true, removedUser: userId };
  },
});

export const isRoomMember = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    const user = await getAuthUser(ctx);

    const roomplayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .collect();

    const player = roomplayers.find((p) => p.userId === user._id);
    return !!player;
  },
});

export const toggleReady = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await getAuthUser(ctx);
    const player = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", roomId).eq("userId", user._id)
      )
      .first();
    if (!player) {
      throw new Error("You are not a player in this room");
    }

    if (player.userId !== user._id) {
      throw new Error("You can only toggle your own ready status");
    }

    if (player.ready) {
      // set as not ready
      await ctx.db.patch(player._id, { ready: false });
      return { ok: true, ready: false };
    } else if (!player.ready) {
      // set as ready
      await ctx.db.patch(player._id, { ready: true });
      return { ok: true, ready: true };
    } else {
      throw new Error("Unexpected player state");
    }
  },
});
