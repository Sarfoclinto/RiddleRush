import { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { computeRiddlePointersFromIndex } from "./fns";

export async function initializeRoomPlaytime(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  riddleIds: Id<"riddles">[]
) {
  const riddles = riddleIds.map((r) => ({ _id: r, done: false }));

  const firstIdx = riddles.findIndex((r) => !r.done);
  const { currentRiddle, previousRiddle, nextRiddle } =
    computeRiddlePointersFromIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      riddles as any,
      firstIdx === -1 ? null : firstIdx
    );

  const payload = {
    roomId,
    riddles,
    play: undefined,
    playing: false, // IMPORTANT: created but not playing yet — host will set playing true when they "Start"
    completed: false,

    currentRiddle: currentRiddle as Id<"riddles"> | undefined,
    previousRiddle: previousRiddle as Id<"riddles"> | undefined,
    nextRiddle: nextRiddle as Id<"riddles"> | undefined,

    currentUser: undefined,
    previousUser: undefined,
    nextUser: undefined,
  };

  return await ctx.db.insert("roomPlaytimes", payload);
}
