import CopyButton from "@/components/CopyButton";
import LoadingDots from "@/components/LoadingDots";
import { message, Tooltip } from "antd";
import { useAction, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "myconvex/_generated/dataModel";

const LoadRiddles = () => {
  const { id } = useParams();
  const room = useQuery(api.rooms.getRoom, { id: id as Id<"rooms"> });
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );

  const loadRoom = useAction(api.actions.loadRoomRiddles);
  const load = async () => {
    setLoading(true);
    try {
      await loadRoom({ roomId: id as Id<"rooms"> });
    } catch (error) {
      console.error(error);
      toast("Failed to load riddles", "error");
    } finally {
      setLoading(false);
    }
  };

  return room ? (
    <div className="flex w-full flex-col h-full items-center justify-center">
      {contextHolder}

      {!room?.playtimeId ? (
        <div className="flex flex-col items-center justify-center gap-y-1">
          <button
            onClick={load}
            disabled={loading}
            className={`border-primary border w-fit flex items-center justify-center gap-2 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium ${loading ? "cursor-progress" : "cursor-pointer"}`}
          >
            {loading ? (
              <LoadingDots inline color="#f84565" size={20} />
            ) : (
              <span>Load riddles</span>
            )}
          </button>
          <span className="text-primary max-md:text-xs text-center mt-3">
            Load riddles to get room code
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="mb-2 self-start text-primary font-medium">
            Room Code:
          </span>
          <div className="relative bg-primary-dull/80 px-30 py-3 text-xl font-medium font-serif rounded-xl ">
            {room?.code}
            <Tooltip title="Copy">
              <CopyButton
                text={room?.code}
                onCopy={() => toast("Copied")}
                className="absolute group border-primary max-md:-bottom-13 max-md:left-[45%] lg:top-1 lg:-right-13  p-2 rounded-full"
                children=""
              />
              <span className="hidden group-hover:absolute text-white text-xl font-medium">
                Copy
              </span>
            </Tooltip>
          </div>
          <div className="max-md:pt-15 pt-3 text-blue-500 font-medium">
            <Link to={`/room/details/${id}`}>See room page</Link>
          </div>
          <div className="mt-3 text-primary font-medium py-1.5 px-2 rounded bg-primary/20">
            <Link to={`/me/my-rooms`}>View my rooms</Link>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex w-full flex-col h-full items-center justify-center">
      <LoadingDots size={20} />
    </div>
  );
};
export default LoadRiddles;
