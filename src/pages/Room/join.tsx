import LoadingDots from "@/components/LoadingDots";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Link, useNavigate, type NavigateFunction } from "react-router-dom";
import {
  CircleQuestionMark,
  CrownIcon,
  PlayIcon,
  SendHorizonalIcon,
  UsersIcon,
} from "lucide-react";
import { Button, message, Modal, Tooltip } from "antd";
// import useScreenSize from "@/hooks/useScreenSize";
import { useDisclosure } from "@/hooks/useDisclosure";
import type { Id } from "myconvex/_generated/dataModel";

const JoinRoom = () => {
  const [code, setCode] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  // const { isMd } = useScreenSize();
  const [requesting, setRequesting] = useState(false);
  const { isOpen, open, close } = useDisclosure();
  const [selectedRoom, SetSelectedRoom] = useState<Room | null>(null);
  const { isLoading: convexAuthLoading } = useConvexAuth();
  const navigate = useNavigate();

  const toast = useCallback(
    (
      message?: string,
      type?: "success" | "error" | "info",
      duration?: number
    ) => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
        duration,
      });
    },
    [messageApi]
  );

  const requestRoom = useMutation(api.users.requestRoom);

  const rooms = useQuery(
    api.rooms.getPublicRooms,
    convexAuthLoading ? "skip" : {}
  );
  const alreadyARoomPlayer = useQuery(
    api.users.alreadyARoomPlayer,
    convexAuthLoading ? "skip" : {}
  );

  const onFinish = (room: Room) => {
    SetSelectedRoom(room);
    open();
  };

  const onRequest = async () => {
    if (!selectedRoom) {
      toast("Sorry an error occurred", "info");
      return;
    }
    try {
      setRequesting(true);
      const res = await requestRoom({ code: selectedRoom.code });
      if (res.ok) {
        toast(res.message, "info");
        close();
      } else {
        toast(res.message, "info");
      }
      setCode("");
    } catch (error) {
      console.error(error);
      toast("Failed to request room", "error");
    } finally {
      setRequesting(false);
    }
  };

  const handleOnSearch = async () => {
    if (!code) {
      toast("Please enter a room code", "error");
      return;
    }
    if (!code.startsWith("RR-")) {
      toast("Invalid room code", "error");
      return;
    }
    if (code.length !== 10) {
      toast("Room code must be 10 characters long", "error");
      return;
    }
    try {
      setRequesting(true);
      const res = await requestRoom({ code });
      if (res.ok) {
        toast(res.message, "info");
      } else {
        toast(res.message, "info");
      }
      setCode("");
    } catch (error) {
      console.error(error);
      toast("Failed to request room", "error");
    } finally {
      setRequesting(false);
    }
  };

  // Show a loading state while Convex auth is being determined
  if (convexAuthLoading || !rooms) {
    return (
      <div className="flex w-full flex-col h-full items-center justify-center">
        <LoadingDots color="#f84565" size={20} />
      </div>
    );
  }

  // Show a loading state while Convex auth is being determined
  return (
    <div className="flex w-full flex-col h-full items-center justify-cente  pt-10">
      {contextHolder}
      <span>Have Room Code? Paste here:</span>
      <div className="relative my-5 w-full flex items-center justify-center gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste code here..."
          className="border rounded-lg h-14 px-5 border-primary shadow shadow-primary max-md:w-full lg:w-1/5 text-2xl font-medium placeholder:text-gray-300"
        />
        <button
          onClick={handleOnSearch}
          className="max-md:absolute p-3 rounded border hover:bg-primary/30 border-primary active:bg-primary disabled:bg-primary-dull cursor-pointer max-md:-bottom-15 md:right-[37%]"
        >
          {requesting ? (
            <LoadingDots inline color="#f84565" size={7} />
          ) : (
            <SendHorizonalIcon />
          )}
        </button>
      </div>

      {convexAuthLoading || !rooms ? (
        <LoadingDots color="#f84565" size={20} className="max-md:mt-15" />
      ) : rooms.length <= 0 ? (
        <div className="flex flex-col text-lg max-md:mt-15">
          <span>No public room yet...</span>
          <span className="mt-3 text-primary flex justify-center font-medium py-1.5 px-2 rounded bg-primary/20">
            <Link to={`/room/create`} className="text-center">
              Create room
            </Link>
          </span>
        </div>
      ) : (
        <div className="max-md:mt-15 border-primary w-full lg:w-9/12 flex flex-col items-center justify-center">
          <span className="text-xl font-medium">
            Or explore other public rooms:{" "}
          </span>
          <span className="flex items-center justify-center gap-x-3 w-full lg:my-5">
            <span className="flex items-center gap-1">
              <div
                style={{ backgroundColor: "pink" }}
                className={` rounded-full p-1`}
              />
              <span className="max-md:text-xs">You own</span>
            </span>
            <span className="flex items-center gap-1">
              <div
                style={{ backgroundColor: "orange" }}
                className={` rounded-full p-1`}
              />
              <span className="max-md:text-xs">Pending</span>
            </span>
            <span className="flex items-center gap-1">
              <div
                style={{ backgroundColor: "green" }}
                className={` rounded-full p-1`}
              />
              <span className="max-md:text-xs">Accpeted</span>
            </span>
            <span className="flex items-center gap-1">
              <div
                style={{ backgroundColor: "#05df72 " }}
                className={` rounded-full p-1`}
              />
              <span className="max-md:text-xs">Match Started</span>
            </span>
          </span>

          {/* <div className="flex mt-5 flex-wrap items-center justify-center w-full max-h-[calc(100dvh-40dvh)] overflow-y-auto scrollbar gap-3">
            {rooms.map((room) => (
              <div
                onClick={() => {
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
                    if (alreadyARoomPlayer?.ok) {
                      if (alreadyARoomPlayer.roomId === room._id) {
                        navigate(`/room/details/${room._id}`);
                      }
                      toast("You are already a player in a room", "info");
                      return;
                    }
                    toast("Sorry, room is already full");
                    return;
                  }
                  if (alreadyARoomPlayer?.ok) {
                    if (alreadyARoomPlayer.roomId === room._id) {
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
                  SetSelectedRoom(room);
                  open();
                }}
                className="relative p-3 lg:px-10 flex flex-col items-center rounded-lg shadow shadow-primary border border-primary w-fit cursor-pointer hover:bg-primary/10 active:bg-black"
                key={room._id}
              >
                <Avatar
                  size={isMd ? 60 : 50}
                  className="!text-xl !font-medium"
                  children={room.name ? room.name[0] : "An"}
                />
                <span className="text-lg font-medium text-pretty mt-3">
                  {room.name}
                </span>
                <span className="text-xs font-medium flex gap-x-2 items-center text-pretty">
                  <span className="text-primary">Players: </span>
                  <span>
                    {room.noOfPlayers} / {room.maxPlayers}
                  </span>
                </span>
                {room.playing && (
                  <div className="absolute hover:bg-green-400/30 active:scale-95 transition duration-100 active:bg-green-400/30 p-1 rounded-full top-2 left-2 bg-green-400 cursor-pointer" />
                )}
                <Notch req={room.request} ishost={room.ishost} />
              </div>
            ))}
          </div> */}
          <div className="flex flex-col mt-5 items-center py-3 w-full max-h-[calc(100dvh-40dvh)] overflow-y-auto scrollbar gap-3">
            {rooms.map((room) => (
              <RoomCard
                room={room}
                roomPlayer={alreadyARoomPlayer}
                key={room._id}
                onFinish={() => onFinish(room)}
                toast={toast}
                navigate={navigate}
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        open={isOpen}
        onCancel={close}
        footer={[
          <Button
            type="primary"
            size="small"
            className="!bg-black !border !border-primary !text-primary"
            onClick={close}
          >
            Cancel
          </Button>,
          <Button
            type="primary"
            size="small"
            loading={requesting}
            disabled={requesting}
            className="!bg-primary !text-white"
            onClick={onRequest}
          >
            Request
          </Button>,
        ]}
        className="!border !border-primary !rounded-xl !p-0"
        title={<span className="!text-primary">Request to join room</span>}
      >
        <span className="text-xl font-medium text-white">
          Click/tap on Request to request to join.
        </span>
      </Modal>
    </div>
  );
};
export default JoinRoom;

export interface Room {
  host: {
    _id: Id<"users">;
    _creationTime: number;
    email?: string | undefined;
    fullname?: string | undefined;
    clerkId?: string | undefined;
    image?: string | undefined;
    username: string;
  } | null;
  _id: Id<"rooms">;
  noOfRiddles: number;
  code: string;
  name: string | undefined;
  hostId: Id<"users">;
  status: "public" | "private";
  maxPlayers: number;
  startUser: Id<"users"> | undefined;
  playing: boolean;
  noOfPlayers: number;
  ishost: boolean;
  request: string;
}

export type toast = (
  message?: string | undefined,
  type?: "success" | "error" | "info" | undefined,
  duration?: number | undefined
) => void;

export type navigate = NavigateFunction;

export type ALreadyRoomPlayer =
  | {
      ok: boolean;
      roomId: Id<"rooms">;
      message?: undefined;
    }
  | {
      ok: boolean;
      message: string;
      roomId?: undefined;
    }
  | undefined;
// const Notch = ({ req, ishost }: { req: string; ishost?: boolean }) => {
//   const color =
//     req.toLowerCase() === "pending"
//       ? "orange"
//       : req === "accepted"
//         ? "green"
//         : req === "rejected"
//           ? "red"
//           : ishost
//             ? "pink"
//             : "";

//   return (
//     <div
//       style={{ backgroundColor: color }}
//       className={` rounded-full p-1 absolute top-1 right-1`}
//     />
//   );
// };

const RoomCard = ({
  room,
  roomPlayer,
  onFinish,
  toast,
  navigate,
}: {
  room: Room;
  roomPlayer: ALreadyRoomPlayer;
  onFinish: () => void;
  toast: toast;
  navigate: navigate;
}) => {
  return (
    <div className="w-2/5 max-lg:w-full cursor-pointer active:bg-black active:shadow-none hover:shadow-[0_0_20px_#f845669c] flex items-center justify-between p-5 rounded-lg shadow- shadow-primary/20- bg-primary/10 border border-primary">
      <div className="flex flex-col">
        <div className="flex items-center gap-x-3">
          <span className="font-medium text-primary text-lg">
            {room.name ?? "Ukn"}
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
