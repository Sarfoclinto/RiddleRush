import TimerProgressBar from "./TImeProgressBar";
import { useRef } from "react";
import type { HeaderProps, TimerProgressBarHandle } from "@/types/common";

const Header = ({ playtime, showProgress = false }: HeaderProps) => {
  const timerRef = useRef<TimerProgressBarHandle | null>(null);
  return (
    <div className="flex w-full flex-col items-center">
      <span className="text-xl capitalize py-2 font-bold font-serif flex items-center gap-x-3">
        <span className="text-primary">Username: </span>
        <span>{playtime?.user?.username}</span>
      </span>
      {showProgress && (
        <div className="w-10/12 font-medium">
          <TimerProgressBar
            ref={timerRef}
            duration={playtime?.secondsPerRiddle || 0}
            autoStart={true}
            muted={true}
            // tickSoundUrl={tick}
            // onTick={(remaining) => {
            //   // optional: update UI or play tick sound
            //   // console.log("remaining", remaining);
            // }}
            onComplete={() => {
              // called when time runs out
              // alert("time's up!");
            }}
            showTime={true}
            fillColor="#f84565"
            trackColor="#000000"
            height="18px"
            className="border border-primary"
          />
        </div>
      )}
      <div className="w-10/12 grid grid-cols-2 lg:grid-cols-4 items-center justify-center py-2">
        <div className="flex items-center justify-center gap-x-3">
          <span className="text-primary">Correct:</span>
          <span className="font-medium">{playtime?.corrects?.length || 0}</span>
        </div>
        <div className="flex items-center justify-center gap-x-3">
          <span className="text-primary">Incorrect:</span>
          <span className="font-medium">
            {playtime?.incorrects?.length || 0}
          </span>
        </div>
        <div className="flex items-center justify-center gap-x-3">
          <span className="text-primary">Skipped:</span>
          <span className="font-medium">{playtime?.skipped?.length || 0}</span>
        </div>
        <div className="flex items-center justify-center gap-x-3">
          <span className="text-primary">Total:</span>
          <span className="font-medium">{playtime?.riddles.length || 0}</span>
        </div>
      </div>
    </div>
  );
};
export default Header;
