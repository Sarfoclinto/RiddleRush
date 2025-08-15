import type { HeaderPlaytime } from "@/types/common";
import Header from "./Header";

type SinglePlayedProps = {
  playtime: HeaderPlaytime;
};
const SinglePlayed = ({ playtime }: SinglePlayedProps) => {
  return (
    <div className="flex flex-col gap-y-3 items-center justify-center w-full h-full text-xl font-medium text-primary">
      <Header playtime={playtime} showProgress={true} />
      <span>Completed</span>
    </div>
  );
};
export default SinglePlayed;
