import type { Id } from "myconvex/_generated/dataModel";
import { useParams } from "react-router-dom";

const ScorePage = () => {
  const { roomId,roomPlaytimeId } = useParams<{
    roomId: Id<"rooms">;
    roomPlaytimeId: Id<"roomPlaytimes">;
  }>();
  return (
    <div className="w-full flex justify-center debug h-full">
      <div>dd</div>
    </div>
  );
};
export default ScorePage;
