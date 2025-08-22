import LoadingDots from "@/components/LoadingDots";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { SendHorizonalIcon } from "lucide-react";
import { Avatar, Button, message, Modal } from "antd";
import useScreenSize from "@/hooks/useScreenSize";
import { useDisclosure } from "@/hooks/useDisclosure";
import type { Id } from "myconvex/_generated/dataModel";

const JoinRoom = () => {
  const [code, setCode] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const { isMd } = useScreenSize();
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

          <div className="flex mt-5 flex-wrap items-center justify-center w-full max-h-[calc(100dvh-40dvh)] overflow-y-auto scrollbar gap-3">
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
  _id: Id<"rooms">;
  code: string;
  name: string | undefined;
  hostId: Id<"users">;
  status: "public" | "private";
  maxPlayers: number;
  startUser: Id<"users"> | undefined;
  playing: boolean;
  noOfPlayers: number;
  request: string;
}
const Notch = ({ req, ishost }: { req: string; ishost?: boolean }) => {
  const color =
    req.toLowerCase() === "pending"
      ? "orange"
      : req === "accepted"
        ? "green"
        : req === "rejected"
          ? "red"
          : ishost
            ? "pink"
            : "";

  return (
    <div
      style={{ backgroundColor: color }}
      className={` rounded-full p-1 absolute top-1 right-1`}
    />
  );
};
