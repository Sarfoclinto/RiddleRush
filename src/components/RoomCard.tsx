import type { ALreadyRoomPlayer, Room, toast, navigate } from "@/types/common";
import { Button, Tooltip } from "antd";
import {
  CircleQuestionMark,
  CrownIcon,
  PlayIcon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

type RoomCardProps = {
  room: Room;
  roomPlayer: ALreadyRoomPlayer;
  onFinish: () => void;
  toast: toast;
  navigate: navigate;
};

const RoomCard = ({
  room,
  roomPlayer,
  onFinish,
  toast,
  navigate,
}: RoomCardProps) => {
  return (
    <div className="w-2/5 max-lg:w-full cursor-pointer active:bg-black active:shadow-none hover:shadow-[0_0_20px_#f845669c] flex items-center justify-between p-5 rounded-lg shadow- shadow-primary/20- bg-primary/10 border border-primary">
      <div className="flex flex-col">
        <div className="flex items-center gap-x-3">
          <span className="font-medium text-primary text-lg">
            {room.name ?? "Unk"}
          </span>
          <span className="flex items-center capitalize gap-x-1">
            <CrownIcon className="!text-amber-400 size-4" />
            <span className="text-sm">
              {room.ishost ? "You" : room.host?.username}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-x-5">
          <span className="flex items-center gap-x-1 text-xs">
            <Tooltip title="Players/Max-players" className="cursor-pointer">
              <UsersIcon className="size-4" />
            </Tooltip>
            <span>
              {room.noOfPlayers} / {room.maxPlayers}
            </span>
          </span>
          <span className="flex items-center gap-x-1 text-xs">
            <Tooltip title="Number of riddles">
              <CircleQuestionMark className="size-4 cursor-pointer" />
            </Tooltip>
            <span>{room.noOfRiddles}</span>
          </span>
        </div>
      </div>
      <div>
        <Button
          onClick={() => {
            action({
              room,
              roomPlayer,
              onFinish,
              toast,
              navigate,
            });
          }}
          className="!bg-transparent !flex !items-center !justify-center !gap-0 !px-2 !py-3"
          size="small"
        >
          <span>{renderMeta({ room, roomPlayer })}</span>
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;

const renderMeta = ({
  room,
  roomPlayer,
}: {
  room: Room;
  roomPlayer: ALreadyRoomPlayer;
}) => {
  let shouldNavigate = false;
  if (room.ishost) {
    shouldNavigate = true;
  } else if (room.noOfPlayers >= room.maxPlayers) {
    if (roomPlayer?.ok) {
      shouldNavigate = true;
    }
  }
  if (room.playing) {
    return <span className="text-primary">Match started</span>;
  } else if (room.request === "accepted") {
    return (
      <Link to={`/room/details/${room._id}`} className="text-primary">
        Visit
      </Link>
    );
  } else if (room.request === "pending") {
    return <span className="text-sky-500">pending req.</span>;
  } else if (shouldNavigate) {
    return (
      <Link to={`/room/details/${room._id}`} className="text-primary">
        Visit
      </Link>
    );
  } else {
    return (
      <div className="!flex !items-center !justify-center !gap-0">
        <PlayIcon className="fill-primary" />
        <span className="text-primary">Join</span>
      </div>
    );
  }
};

const action = ({
  room,
  roomPlayer,
  onFinish,
  navigate,
  toast,
}: {
  room: Room;
  roomPlayer: ALreadyRoomPlayer;
  onFinish: () => void;
  toast: toast;
  navigate: navigate;
}) => {
  if (room.playing) {
    toast("This room is currently playing", "info");
    return;
  }
  if (room.request === "accepted") {
    navigate(`/room/details/${room._id}`);
    return;
  }
  if (room.request === "pending") {
    toast("You already have a req for this room");
    return;
  }
  if (room.noOfPlayers >= room.maxPlayers) {
    if (roomPlayer?.ok) {
      if (roomPlayer.roomId === room._id) {
        navigate(`/room/details/${room._id}`);
      }
      toast("You are already a player in a room", "info");
      return;
    }
    toast("Sorry, room is already full");
    return;
  }
  if (roomPlayer?.ok) {
    if (roomPlayer.roomId === room._id) {
      navigate(`/room/details/${room._id}`);
    }
    toast("You are already a player in a room", "info");
    return;
  }
  if (room.ishost) {
    toast("You own the room already");
    navigate(`/room/details/${room._id}`);
    return;
  }
  onFinish();
};
