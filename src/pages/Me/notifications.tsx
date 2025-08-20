import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import LoadingDots from "@/components/LoadingDots";
import type { Id } from "myconvex/_generated/dataModel";
import { Avatar, Button } from "antd";
import { CheckIcon } from "lucide-react";

const MyNotification = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();

  const notifications = useQuery(
    api.notification.notificationsAndDetails,
    isLoading || !isAuthenticated ? "skip" : {}
  );

  // Show a loading state while Convex auth is being determined
  if (isLoading || !notifications) {
    return (
      <div className="flex w-full flex-col h-full items-center justify-center">
        <LoadingDots color="#f84565" size={20} />
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col h-full items-center pt-10">
      <div className="w-full lg:w-6/12 flex flex-col">
        <span className="text-lg font-medium">Notications:</span>
        {notifications.length < 1 ? (
          <div className="text-2xl text-primary font-medium mx-auto my-10">
            No notification yet
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60dvh] scrollbar overflow-y-auto">
            {notifications.map((not) => (
              <NotCard key={not._id} nt={not} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default MyNotification;

export interface Notification {
  creatorDetails: {
    username: string | undefined;
    image: string | undefined;
  };
  roomName: string | undefined;
  roomCode: string | undefined;
  _id: Id<"notification">;
  _creationTime: number;
  roomId?: Id<"rooms"> | undefined;
  type: "accepted" | "request";
  creator: Id<"users">;
  reciever: Id<"users">;
  read: boolean;
}

const NotCard = ({ nt }: { nt: Notification }) => {
  if (nt.type === "request") {
    return (
      <div className="relative flex w-full items-center px-3 py-2 active:bg-primary/10 bg-primary/10 hover:bg-primary/20 justify-between shadow shadow-primary/30 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex max-md:flex-col items-center gap-x-2">
              <span className="capitalize max-md:self-start lg:text-lg font-medium text-primary">
                {nt.creatorDetails.username}
              </span>
              <span className="max-md:self-start">
                {" "}
                is requesting to join your Room
              </span>
            </span>
            <span className="flex items-center gap-x-2">
              <span className="flex items-center gap-x-2">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName ?? "An"}</span>
              </span>
              <span className="flex items-center gap-x-2">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>

        {!nt.read ? (
          <div className="max-md:absolute max-md:top-1 max-md:right-1 lg:flex items-center gap-x-2">
            <Button
              size="small"
              className="!border !bg-black !text-primary border-primary"
            >
              Reject
            </Button>
            <Button size="small" className="!bg-primary !text-white">
              Accept
            </Button>
          </div>
        ) : (
          <span className="p-2 rounded-full bg-primary/20">
            <CheckIcon />
          </span>
        )}
      </div>
    );
  } else {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between shadow shadow-primary my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                {nt.creatorDetails.username}
              </span>
              <span> is requesting to join your Room</span>
            </span>
            <span className="flex items-center gap-x-2">
              <span className="flex items-center gap-x-2">
                <span className="text-primary">Room name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-2">
                <span className="text-primary">Room Code:</span>
                <span>{nt.roomCode}</span>
              </span>
            </span>
          </span>
        </div>
      </div>
    );
  }
};
