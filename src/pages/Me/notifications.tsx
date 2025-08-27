import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import LoadingDots from "@/components/LoadingDots";
import type { Id } from "myconvex/_generated/dataModel";
import { Avatar, Button } from "antd";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "@/utils/dateTimeHelper";

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
            {notifications
              .slice()
              .sort((a, b) => b._creationTime - a._creationTime)
              .map((not) => (
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
  type:
    | "accepted"
    | "request"
    | "quit"
    | "removed"
    | "ownership_transfer"
    | "reject";
  creator: Id<"users">;
  reciever: Id<"users">;
  read: boolean;
}

const NotCard = ({ nt }: { nt: Notification }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const acceptReq = useMutation(api.rooms.acceptRoomRequest);
  const rejectReq = useMutation(api.rooms.rejectRoomRequest);
  const readMsg = useMutation(api.notification.readNotification);

  const handleReadAndLeave = async () => {
    try {
      setLoading(true);
      await readMsg({
        id: nt._id,
      });
      navigate(`/room/details/${nt.roomId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async () => {
    try {
      setLoading(true);
      await readMsg({
        id: nt._id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (nt.type !== "request") return;
    try {
      setLoading(true);
      await acceptReq({
        // creatorId: nt.creator,
        // roomId: nt.roomId!,
        notificationId: nt._id,
      });
      navigate(`/room/details/${nt.roomId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (nt.type !== "request") return;
    try {
      setLoading(true);
      await rejectReq({
        // creatorId: nt.creator,
        // roomId: nt.roomId!,
        notificationId: nt._id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (nt.type === "request") {
    return (
      <div className="relative flex w-full items-center px-3 py-2 active:bg-primary/10 bg-primary/10 hover:bg-primary/20 justify-between shadow shadow-primary/10 my-1 rounded-lg cursor-pointer">
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
            <span className="flex items-center gap-x-2 max-md:text-xs">
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
          <div className="max-md:absolute max-md:top-1 max-md:right-1 flex flex-col items-center">
            <div className="lg:flex items-center gap-x-2">
              <Button
                onClick={handleReject}
                loading={loading}
                disabled={loading}
                size="small"
                className="!border !bg-black !text-primary border-primary"
              >
                Reject
              </Button>
              <Button
                loading={loading}
                disabled={loading}
                onClick={handleAccept}
                size="small"
                className="!bg-primary !text-white"
              >
                Accept
              </Button>
            </div>
            <span className="text-xs text-primary self-end">
              {timeAgo(nt._creationTime, { short: true })}
            </span>
          </div>
        ) : (
          <span className="p-2 rounded-full bg-primary/20">
            <CheckIcon />
          </span>
        )}
      </div>
    );
  } else if (nt.type === "accepted") {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between active:bg-green-400/10 bg-green-400/10 hover:bg-green-400/20 shadow shadow-green-400/20 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                You
              </span>
              <span> have been accepted into room</span>
            </span>
            <span className="flex items-center gap-x-2 max-md:text-xs">
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>

        <div className="flex flex-col">
          <button
            onClick={handleReadAndLeave}
            disabled={loading}
            className={`px-2 rounded bg-green-400/20 ${loading ? "cursor-no-drop" : "cursor-pointer"}`}
          >
            {loading ? (
              <LoadingDots inline color="#f84565" size={5} />
            ) : (
              <span className="text-xs">
                Visit <span className="max-md:hidden">room</span>{" "}
              </span>
            )}
          </button>
          <span className="text-xs text-green-400 self-end">
            {timeAgo(nt._creationTime, { short: true })}
          </span>
        </div>
      </div>
    );
  } else if (nt.type === "removed") {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between active:bg-amber-400/10 bg-amber-400/10 hover:bg-amber-400/20 shadow shadow-amber-400/20 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                You
              </span>
              <span> were removed from this room</span>
            </span>
            <span className="flex items-center gap-x-2 max-md:text-xs">
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <button
            onClick={handleRead}
            disabled={loading}
            className={`px-2 rounded bg-amber-400/20 ${loading ? "cursor-no-drop" : "cursor-pointer"}`}
          >
            {loading ? <LoadingDots inline color="#f84565" size={5} /> : "read"}
          </button>
          <span className="text-xs text-primary self-end">
            {timeAgo(nt._creationTime, { short: true })}
          </span>
        </div>
      </div>
    );
  } else if (nt.type === "quit") {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between active:bg-purple-400/10 bg-sky-400/10 hover:bg-sky-400/20 shadow shadow-sky-400/20 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                {nt.creatorDetails.username}
              </span>
              <span> exited this room</span>
            </span>
            <span className="flex items-center gap-x-2 max-md:text-xs">
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <button
            onClick={handleRead}
            disabled={loading}
            className={`px-2 rounded bg-sky-500/20 ${loading ? "cursor-no-drop" : "cursor-pointer"}`}
          >
            {loading ? <LoadingDots inline color="#f84565" size={5} /> : "read"}
          </button>
          <span className="text-xs text-primary self-end">
            {timeAgo(nt._creationTime, { short: true })}
          </span>
        </div>
      </div>
    );
  } else if (nt.type === "ownership_transfer") {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between active:bg-purple-400/10 bg-purple-400/10 hover:bg-purple-400/20 shadow shadow-purple-400/20 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                {"You"}
              </span>
              <span> are the new host of this room. </span>
            </span>
            <span className="flex items-center gap-x-2 max-md:text-xs">
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <button
            onClick={handleReadAndLeave}
            disabled={loading}
            className={`px-2 rounded bg-purple-500/20 ${loading ? "cursor-no-drop" : "cursor-pointer"}`}
          >
            {loading ? (
              <LoadingDots inline color="#f84565" size={5} />
            ) : (
              <span className="text-xs">
                Visit <span className="max-md:hidden">room</span>{" "}
              </span>
            )}
          </button>
          <span className="text-xs text-primary self-end">
            {timeAgo(nt._creationTime, { short: true })}
          </span>
        </div>
      </div>
    );
  } else if (nt.type === "reject") {
    return (
      <div className="flex w-full items-center px-3 py-2 justify-between active:bg-violet-400/10 bg-violet-400/10 hover:bg-violet-400/20 shadow shadow-violet-400/20 my-1 rounded-lg cursor-pointer">
        <div className="flex items-center gap-1">
          <Avatar src={nt.creatorDetails.image} />
          <span className="flex flex-col gap-y">
            <span className="flex items-center gap-x-2">
              <span className="capitalize text-lg font-medium text-primary">
                {"You"}
              </span>
              <span> were rejected to join room. </span>
            </span>
            <span className="flex items-center gap-x-2 max-md:text-xs">
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Name:</span>
                <span>{nt.roomName}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <span className="text-primary">Code:</span>
                <span>{nt.roomCode?.slice(3, 10)}</span>
              </span>
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <button
            onClick={handleRead}
            disabled={loading}
            className={`px-2 rounded bg-violet-500/20 ${loading ? "cursor-no-drop" : "cursor-pointer"}`}
          >
            {loading ? <LoadingDots inline color="#f84565" size={5} /> : "read"}
          </button>
          <span className="text-xs text-primary self-end">
            {timeAgo(nt._creationTime, { short: true })}
          </span>
        </div>
      </div>
    );
  }
};
