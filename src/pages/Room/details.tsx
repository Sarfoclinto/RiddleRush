import {
  Authenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, useParams } from "react-router-dom";
import LoadingDots from "@/components/LoadingDots";
import { useUser } from "@clerk/clerk-react";
import { Avatar, Button, message, Modal, Tooltip } from "antd";
import useScreenSize from "@/hooks/useScreenSize";
import type { Id } from "myconvex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { XIcon } from "lucide-react";
import { useDisclosure } from "@/hooks/useDisclosure";

const RoomPlayers = () => {
  const { isMd } = useScreenSize();
  const { id } = useParams();
  const { user } = useUser();
  const [mode, setMode] = useState<"remove" | "quit" | "terminate" | null>(
    null
  );
  const { isOpen, close, open } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Player | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
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

  // Wait for Convex auth state
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();

  // Only run these queries once we know the relevant auth info is available.
  // Passing `undefined` prevents the query from firing.
  const me = useQuery(
    api.users.getUserAndRoomInfo,
    isAuthenticated && id && !convexAuthLoading
      ? { roomId: id as Id<"rooms"> }
      : "skip"
  );

  const room = useQuery(
    api.rooms.getRoom,
    isAuthenticated && id && !convexAuthLoading
      ? { id: id as Id<"rooms"> }
      : "skip"
  );

  useEffect(() => {
    if (me) {
      if (!me?.isRoomMember) {
        navigate("/room/join");
      }
    }
  }, [me, navigate]);

  const players = useQuery(
    api.rooms.getRoomPlayers,
    isAuthenticated && id ? { roomId: id as Id<"rooms"> } : "skip"
  );

  const exitRoom = useMutation(api.rooms.quitRoom);
  const removeUser = useMutation(api.rooms.removeUserFromRoom);
  const toggleReady = useMutation(api.rooms.toggleReady);
  const transferOwnership = useMutation(api.users.transferOwnership);

  const handleToggleReady = async () => {
    try {
      setToggling(true);
      const res = await toggleReady({
        roomId: id as Id<"rooms">,
      });
      if (!res?.ok) {
        return toast("Sorry, an error occurred", "error");
      }
      toast(res.ready ? "All set" : "Cancelled ready", "success");
    } catch (error) {
      console.error("Error toggling ready state:", error);
      toast("Failed to toggle ready state", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleYes = async () => {
    try {
      if (room && user) {
        setLoading(true);
        if (mode === "quit") {
          await exitRoom({ roomId: room?._id });
          navigate("/room/join");
          toast("You have left the room", "success");
        } else if (mode === "remove") {
          if (!selectedUsers) return toast("No user selected", "info");
          if (!selectedUsers.user)
            return toast("Sorry, an error occured", "error");
          await removeUser({
            roomId: room?._id,
            userId: selectedUsers.user?._id,
          });
          toast("User has been removed", "success");
        } else if (mode === "terminate") {
          // if the user is the host, we need to transfer ownership
          await transferOwnership({
            roomId: room?._id,
          });
        } else {
          toast("No selected mode", "info");
          //
        }
      } else {
        toast("No room or user found", "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      close();
    }
  };

  const ownsRoom = useMemo(() => {
    if (room && me) {
      return room?.hostId === me?._id;
    }
    return false;
  }, [me, room]);
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
      {contextHolder}
      <Authenticated>
        {players && me ? (
          <div className="flex w-full flex-col h-full items-center justify-center ">
            {me && room && (
              <div className="flex relative max-md:flex-col items-center justify-center gap-3 mb-5">
                <div
                  key={me._id}
                  className="border md:hover:bg-primary/10 active:bg-primary/10 cursor-pointer relative border-primary shadow shadow-primary rounded-xl p-3 px-10 flex flex-col items-center"
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
                  {!ownsRoom && (
                    <div
                      onClick={() => {
                        setMode("quit");
                        open();
                      }}
                      className="absolute hover:bg-primary/30 active:scale-95 transition duration-100 active:bg-primary/30 p-2 rounded-full top-2 right-2 bg-primary/20 cursor-pointer"
                    >
                      <XIcon className="size-3" />
                    </div>
                  )}
                  <div className="absolute hover:bg-green-400/30 active:scale-95 transition duration-100 active:bg-green-400/30 p-1 rounded-full top-2 left-2 bg-green-400 cursor-pointer" />
                  {ownsRoom && (
                    <div className="absolute hover:bg-green-400/30 active:scale-95 transition duration-100 active:bg-green-400/30 p-1 rounded-full top-2 right-2 bg-pink-300 cursor-pointer" />
                  )}
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-col items-center justify-center text-xs">
                    <span className="flex items-center gap-x-1">
                      <span className="text-primary">Name:</span>
                      <span>{room?.name ?? "Ukn"}</span>
                    </span>

                    <span className="flex items-center gap-x-1">
                      <span className="text-primary">Code:</span>
                      <span>{room?.code ?? "Ukn"}</span>
                      <CopyButton
                        text={room?.code}
                        children=""
                        onCopy={() => toast("Room code copied")}
                      />
                    </span>
                    <span className="flex items-center gap-x-1">
                      <span className="text-primary">Max:</span>
                      <span>{room?.maxPlayers}</span>
                    </span>
                    <span className="flex items-center gap-x-1">
                      <span className="text-primary">Ready/Accpeted:</span>
                      <span>
                        {room?.readyPlayers} / {room.acceptedPlayers}
                      </span>
                    </span>
                  </div>
                  <div>
                    {ownsRoom ? (
                      <div className="flex flex-col items-center justify-center">
                        <Button className="!bg-primary/20 max-md:!px-3 max-md:!text-xs max-md:!py-1.5 !px-5 !py-2 !rounded-lg !cursor-pointer !border border-primary hover:!bg-primary/10 active:!bg-primary/30 active:scale-95 transition duration-100 !text-lg !font-medium !text-white">
                          Start Game
                        </Button>
                        <Tooltip title="Click to remove yourself from the room">
                          <button
                            onClick={() => {
                              setMode("terminate");
                              open();
                            }}
                            className="p-1.5 rounded-full cursor-pointer transition duration-100 hover:scale-105 active:scale-100 hover:bg-primary/30 active:bg-primary/40 bg-primary/20 mt-3"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Button
                          onClick={handleToggleReady}
                          loading={toggling}
                          disabled={toggling}
                          className={`${me.isReady ? "!bg-primary/20" : "!bg-green-400/20"} max-md:!px-3 max-md:!text-xs max-md:!py-1.5 !px-5 !py-2 rounded-lg cursor-pointer !border ${me.isReady ? "!border-primary" : "!border-green-500"} ${me.isReady ? "hover:!bg-primary/10" : "hover:!bg-green-400/10"} active:!bg-green-400/30 !active:scale-95 transition duration-100 !text-lg !font-medium !text-white`}
                        >
                          {me.isReady ? "Cancel" : "Ready???"}
                        </Button>
                        <span className="text-xs text-pretty mt-1">
                          {me.isReady
                            ? "Waiting for start game..."
                            : "Click to ready"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <span className="m-3 flex items-center justify-center gap-x-3">
              <span className="flex items-center gap-x-1 text-xs">
                <span className="p-1 rounded-full bg-green-400" />
                <span className="">Ready</span>
              </span>
              <span className="flex items-center gap-x-1 text-xs">
                <span className="p-1 rounded-full bg-primary" />
                <span className="">Not-ready</span>
              </span>
              <span className="flex items-center gap-x-1 text-xs">
                <span className="p-1 rounded-full bg-pink-300" />
                <span className="">Room owner</span>
              </span>
            </span>
            {(players ?? []).length > 0 ? (
              <div className="flex flex-wrap mt-5 items-center justify-center gap-3 w-9/12">
                {players?.map((player) => (
                  <div
                    key={player._id}
                    className="border relative border-primary hover:bg-primary/10 cursor-pointer shadow rounded-xl p-3 md:px-5 w-fit flex flex-col items-center justify-center"
                  >
                    <div className="w-fit h-fit rounded-full shadow shadow-primary">
                      <Avatar
                        src={player.user?.image}
                        className="shadow border border-amber-400"
                        shape="circle"
                        size={isMd ? 100 : 50}
                      />
                    </div>
                    <span className="text-lg font-medium text-pretty mt-3 capitalize">
                      {player.user?.username}
                    </span>

                    {ownsRoom && (
                      <div
                        onClick={() => {
                          setMode("remove");
                          setSelectedUsers(player);
                          open();
                        }}
                        className="absolute hover:bg-primary/30 active:scale-95 transition duration-100 active:bg-primary/30 p-2 rounded-full top-1 right-1 bg-primary/20 cursor-pointer"
                      >
                        <XIcon className="size-3" />
                      </div>
                    )}
                    {player.ready ? (
                      <div className="absolute hover:bg-green-400/30 active:scale-95 transition duration-100 active:bg-green-400/30 p-1 rounded-full top-1 left-1 bg-green-400 cursor-pointer" />
                    ) : (
                      <div className="absolute hover:primary/30 active:scale-95 transition duration-100 active:bg-primary/30 p-1 rounded-full top-2 left-2 bg-primary cursor-pointer" />
                    )}
                  </div>
                ))}

                <div className="m-2 flex flex-col items-center justify-center w-fit p-3">
                  <span>Waiting for others</span>
                  <LoadingDots />
                </div>
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

      {/* Modal */}
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
            No
          </Button>,
          <Button
            type="primary"
            size="small"
            loading={loading}
            disabled={loading}
            className="!bg-primary !text-white"
            onClick={handleYes}
          >
            Yes
          </Button>,
        ]}
        className="!border !border-primary !rounded-xl !p-0"
        title={
          <span className="!text-primary">
            {mode === "quit" ? "Quit Room" : "Remove Player"}
          </span>
        }
      >
        <p className="lg:text-lg font-medium text-primary">
          {mode === "quit" ? (
            <span>Are you sure you want to exit this room?</span>
          ) : mode === "terminate" ? (
            <span>
              You are the host. Are you sure you want to hand over to another
              user?
            </span>
          ) : (
            <span>
              Are you sure you want to remove{" "}
              <span className="text-white capitalize">
                {selectedUsers?.user?.username ?? "user"}
              </span>{" "}
              from this room?
            </span>
          )}
        </p>
      </Modal>
    </div>
  );
};
export default RoomPlayers;

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
