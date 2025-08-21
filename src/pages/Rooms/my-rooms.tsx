import LoadingDots from "@/components/LoadingDots";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Tag } from "antd";
import { timeAgo } from "@/utils/dateTimeHelper";

const MyRooms = () => {
  const { isLoading: convexAuthLoading } = useConvexAuth();
  const navigate = useNavigate();

  const rooms = useQuery(api.users.myRooms);

  if (convexAuthLoading && !rooms) {
    return (
      <div className="flex w-full flex-col h-full items-center justify-center">
        <LoadingDots color="#f84565" size={20} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col h-full items-center justify-cente overflow-y-auto">
      <span className="text-xl">My Rooms: </span>
      {(rooms || [])?.length > 0 ? (
        <div className={`flex flex-col gap-3 max-md:w-full w-6/12 p-5`}>
          {rooms?.map((room, index) => (
            <div
              onClick={() => navigate(`/room/details/${room._id}`)}
              key={room._id}
              className="py-5 w-full bg-primary/20 rounded-lg shadow shadow-primary animate-puls flex items-center justify-between px-3 hover:shadow-none active:shadow-none cursor-pointer"
            >
              <div className="flex items-center gap-x-1">
                <Avatar src={`https://i.pravatar.cc/150?img=${index}`} />
                <span className="flex flex-col pl-2">
                  <span className="font-medium capitalize">
                    {room.name ?? "Anonymous"}
                  </span>
                  <Tag
                    className="w-fit font-medium max-md:!text-xs capitalize"
                    color={room.status === "public" ? "green" : "red"}
                  >
                    {room.status}
                  </Tag>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="flex gap-x-2 text-primary text-xs">
                  <span>Code:</span>
                  <span className="text-white text-right">{room.code}</span>
                </span>
                <span className="flex gap-x-2 text-primary text-xs">
                  <span>Max-players: </span>
                  <span className="text-white text-center">
                    {room.maxPlayers}
                  </span>
                </span>
                <span className="text-primary text-right text-xs">
                  {timeAgo(room._creationTime)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex w-full flex-col h-full items-center justify-center">
          <span className="text-2xl">No room yet</span>

          <Link
            to="/room/create"
            className="p-2 text-primary rounded bg-primary/20 my-3"
          >
            Create a room
          </Link>
        </div>
      )}
    </div>
  );
};
export default MyRooms;
