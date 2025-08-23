import { Avatar } from "antd";
import type { Id } from "myconvex/_generated/dataModel";

type PlayerAvatarProps = {
  player: Player;
  isPlaying: boolean;
};
const PlayerAvatar = ({ isPlaying, player }: PlayerAvatarProps) => {
  return (
    <div className="flex flex-col items-center justify-center relative p-1 -[0.5px] border-stone-200">
      <Avatar
        src={player.user?.image}
        className={`rounded-full shadow ${isPlaying ? "shadow-green-400" : "shadow-stone-200"}`}
      />
      {isPlaying && (
        <div className="p-1 rounded-full absolute bg-green-400 top-0 right-0" />
      )}
    </div>
  );
};
export default PlayerAvatar;

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
  roomId: Id<"rooms">;
  userId: Id<"users">;
}
