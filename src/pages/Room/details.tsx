import { Authenticated, useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "react-router-dom";
import type { Id } from "myconvex/_generated/dataModel";
import LoadingDots from "@/components/LoadingDots";
import { useUser } from "@clerk/clerk-react";
import { Avatar } from "antd";
import useScreenSize from "@/hooks/useScreenSize";

const RoomPlayers = () => {
  const { isMd } = useScreenSize();
  const { id } = useParams();
  const { user } = useUser();

  // Wait for Convex auth state
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();

  // Only run these queries once we know the relevant auth info is available.
  // Passing `undefined` prevents the query from firing.
  const me = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const players = useQuery(
    api.rooms.getRoomPlayers,
    isAuthenticated && id ? { roomId: id as Id<"rooms"> } : "skip"
  );

  // Show a loading state while Convex auth is being determined
  if (convexAuthLoading) {
    return (
      <div className="flex w-full flex-col h-full items-center justify-center">
        <LoadingDots color="#f84565" size={20} />
      </div>
    );
  }

  return (
    <div>
      <Authenticated>
        {players && me ? (
          <div className="flex w-full flex-col h-full items-center justify-center ">
            {me && (
              <div
                key={me._id}
                className="border border-primary shadow shadow-primary rounded-xl p-3 px-10 flex flex-col items-center"
              >
                <div className="w-fit h-fit rounded-full shadow shadow-primary">
                  <Avatar
                    src={me.image}
                    className="shadow border border-amber-400"
                    shape="circle"
                    size={isMd ? 100 : 50}
                  />
                </div>
                <span className="text-lg font-medium text-pretty mt-3">
                  You
                </span>
              </div>
            )}
            {(players ?? []).length > 0 ? (
              <div className="flex-wrap gap-3 w-9/12">
                {players?.map((player) => (
                  <div
                    key={player._id}
                    className="border border-primary shadow rounded-xl p-3"
                  >
                    <div className="w-fit h-fit rounded-full shadow shadow-primary">
                      <Avatar
                        src={player.user?.image}
                        className="shadow border border-amber-400"
                        shape="circle"
                        size={isMd ? 100 : 50}
                      />
                    </div>
                    <span className="text-lg font-medium text-pretty mt-3">
                      {player.user?.username}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                Waiting for others <LoadingDots />
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col h-full items-center justify-center">
            <LoadingDots color="#f84565" size={20} />
          </div>
        )}
      </Authenticated>
    </div>
  );
};
export default RoomPlayers;
