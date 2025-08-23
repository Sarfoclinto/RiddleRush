import { useConvexAuth, useQuery } from "convex/react";
import type { Id } from "myconvex/_generated/dataModel";
import { useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import useScreenSize from "@/hooks/useScreenSize";
import LoadingDots from "@/components/LoadingDots";
import { useMemo } from "react";
import { capitalize, computeScores } from "@/utils/fns";
import { Avatar, Table, Grid } from "antd";
import BlurCircle from "@/components/BlurCircle";
import PlayerScoreCard from "@/components/PlayerScoreCard";
import { buildRankingTable } from "@/utils/ranking";
import { buildMobileConfigFromRankingRows } from "@/utils/mobileRanking";

const { useBreakpoint } = Grid;
const ScorePage = () => {
  const { isMd } = useScreenSize();
  const { roomId, roomPlaytimeId } = useParams<{
    roomId: Id<"rooms">;
    roomPlaytimeId: Id<"roomPlaytimes">;
  }>();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const screen = useBreakpoint();
  const isMobile = !screen.md;

  // queries
  const roomData = useQuery(
    api.rooms.getRoomById,
    isLoading || !isAuthenticated
      ? "skip"
      : {
          id: roomId as Id<"rooms">,
          roomPlaytimeId: roomPlaytimeId as Id<"roomPlaytimes">,
        }
  );

  const plays = roomData?.roomPlaytime?.play;
  // const scores = useMemo(() => computeScores(plays), [plays]);

  const myUserId = roomData?.user._id;
  const myScores = useMemo(
    () =>
      myUserId
        ? computeScores(plays, myUserId)
        : { correct: 0, incorrect: 0, skipped: 0, timedOut: 0, total: 0 },
    [plays, myUserId]
  );
  const me = useMemo(() => {
    return roomData?.user;
  }, [roomData]);

  const otherUsers = useMemo(() => {
    return roomData?.readyPlayersDetails.filter((pl) => pl.userId !== me?._id);
  }, [roomData, me]);

  // desktip data
  const { dataSource: desktopData, columns: desktopColumns } = useMemo(() => {
    const players = roomData?.readyPlayersDetails || [];
    const plays = roomData?.roomPlaytime?.play || [];
    return buildRankingTable(players, plays);
  }, [roomData?.readyPlayersDetails, roomData?.roomPlaytime?.play]);

  // mobile transformation
  const { dataSource: mobileData, columns: mobileColumns } = useMemo(() => {
    return buildMobileConfigFromRankingRows(desktopData);
  }, [desktopData]);

  if (!roomData || !me || !otherUsers) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-primary">
        <LoadingDots dotCount={5} color="#f84565" size={isMd ? 30 : 20} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center h-full">
      {/* me */}
      <div className="flex items-center gap-x-3">
        <div className="rounded-xl p-3 border border-primary/50 flex flex-col items-center justify-center">
          <Avatar
            src={me?.image}
            size={isMd ? 80 : 50}
            className="rounded-full !border-[0.1px]/ shadow !shadow-primary"
          />
          <div>
            <span className="mr-1">{capitalize(me?.username)}</span>
            <sub className="text-xs text-primary font-medium">(You)</sub>
          </div>
        </div>
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

      <span className="my-10 text-center font-medium flex flex-col gap-2">
        <span className="lg:text-3xl">Team's Results</span>
        <span className="flex items-center gap-x-4">
          <span className="flex items-center gap-x-1">
            <span className="bg-green-400 font-medium p-1 rounded-xl" />
            <span className="max-lg:text-xs text-sm">Correct</span>
          </span>
          <span className="flex items-center gap-x-1">
            <span className="bg-primary font-medium p-1 rounded-xl" />
            <span className="max-lg:text-xs text-sm">Incorrect</span>
          </span>
          <span className="flex items-center gap-x-1">
            <span className="bg-amber-400 font-medium p-1 rounded-xl" />
            <span className="max-lg:text-xs text-sm">Skipped</span>
          </span>
          <span className="flex items-center gap-x-1">
            <span className="bg-sky-400 font-medium p-1 rounded-xl" />
            <span className="max-lg:text-xs text-sm">Timedout</span>
          </span>
        </span>
      </span>

      <div className="w-full max-h-full overflow-auto scrollbar py-3 flex flex-wrap justify-center gap-7">
        {[...otherUsers]?.map((pl, index) => (
          <PlayerScoreCard plays={plays} pl={pl} key={index} />
        ))}
      </div>

      <div className="w-full overflow-auto scrollbar ">
        {isMobile ? (
          <Table
            dataSource={mobileData}
            columns={mobileColumns}
            rowKey="key"
            pagination={false}
            // optionally reduce row height for mobile:
            // size="small"
          />
        ) : (
          <Table
            dataSource={desktopData}
            columns={desktopColumns}
            rowKey="key"
            pagination={false}
          />
        )}
      </div>

      <>
        <BlurCircle
          top="50px"
          left={isMd ? "20px" : "-150px"}
          size={isMd ? "xl" : "md"}
          animate
        />
        <BlurCircle
          bottom="-10px"
          right="20px"
          size={isMd ? "xl" : "md"}
          animate
        />
      </>
    </div>
  );
};
export default ScorePage;
