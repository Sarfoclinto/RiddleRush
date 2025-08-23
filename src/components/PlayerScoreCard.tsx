import useScreenSize from "@/hooks/useScreenSize";
import { capitalize, computeScores } from "@/utils/fns";
import { Avatar } from "antd";
import type { Id } from "myconvex/_generated/dataModel";
import { useMemo } from "react";

interface Player {
  user: {
    _id: Id<"users">;
    _creationTime: number;
    email?: string | undefined;
    fullname?: string | undefined;
    clerkId?: string | undefined;
    image?: string | undefined;
    username: string;
  } | null;
  ishost: boolean;
  _id: Id<"roomPlayers">;
  _creationTime: number;
  ready?: boolean | undefined;
  joinIndex?: number | undefined;
  userId: Id<"users">;
  roomId: Id<"rooms">;
}

interface Play {
  done: boolean;
  riddleId: Id<"riddles">;
  playedBy: Id<"users">;
  turnIndex: number;
  result: "skipped" | "correct" | "incorrect" | "timedOut";
}

const PlayerScoreCard = ({
  pl,
  plays,
}: {
  pl: Player;
  plays: Play[] | undefined;
}) => {
  const myScores = useMemo(
    () =>
      pl.userId
        ? computeScores(plays, pl.userId)
        : { correct: 0, incorrect: 0, skipped: 0, timedOut: 0, total: 0 },
    [pl.userId, plays]
  );
  const { isMd } = useScreenSize();
  return (
    <div className="flex items-center gap-x-1 h-fit !m-0">
      <div className="rounded-xl p-3 px-5 border border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition duration-100">
        <Avatar
          src={pl.user?.image}
          size={isMd ? 80 : 50}
          className="rounded-full shadow !shadow-primary"
        />
        <div>
          <span className="mr-1">{capitalize(pl.user?.username || "")}</span>
        </div>
      </div>
      <div className="flex items-center gap-x-1 self-stretch py-2 pl-1">
        <div className="flex flex-col justify-between self-stretch gap-1">
          <span className="bg-green-400 font-medium p-1.5 rounded-xl" />
          <span className="bg-primary font-medium p-1.5 rounded-xl" />
          <span className="bg-amber-400 font-medium p-1.5 rounded-xl" />
          <span className="bg-sky-400 font-medium p-1.5 rounded-xl" />
        </div>
        <div className="flex flex-col justify-between self-stretch">
          <span className="text-green-400 font-medium text-center text-xs">
            {myScores.correct}
          </span>
          <span className="text-primary font-medium text-center text-xs">
            {myScores.incorrect}
          </span>
          <span className="text-amber-400 font-medium text-center text-xs">
            {myScores.skipped}
          </span>
          <span className="text-sky-400 font-medium text-center text-xs">
            {myScores.timedOut}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreCard;


