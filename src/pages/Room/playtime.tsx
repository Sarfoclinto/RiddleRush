import Countdown from "@/components/Countdown";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "myconvex/_generated/dataModel";
import { Avatar, Button, Tooltip } from "antd";
import LoadingDots from "@/components/LoadingDots";
import useScreenSize from "@/hooks/useScreenSize";
import CopyButton from "@/components/CopyButton";
import { ChevronRightIcon, XIcon } from "lucide-react";
import TimerProgressBar from "@/components/TImeProgressBar";
import type { TimerProgressBarHandle } from "@/types/common";
import { shuffle } from "@/utils/riddleFns";

const SECONDS = 5;
const RoomPlaytime = () => {
  const { isMd } = useScreenSize();
  const timerRef = useRef<TimerProgressBarHandle | null>(null);
  const [value, setValue] = useState("");
  const [countdownDone, setCountdownDone] = useState(() => {
    if (typeof window === "undefined") return false;
    const val = localStorage.getItem("countdownDone");
    if (!val) return false;
    try {
      const parsed = JSON.parse(val);
      if (
        parsed &&
        parsed.done === true &&
        parsed.roomId === roomId &&
        parsed.roomPlaytimeId === roomPlaytimeId &&
        parsed.seconds === SECONDS
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const { roomId, roomPlaytimeId } = useParams<{
    roomId: string;
    roomPlaytimeId: string;
  }>();

  const { isAuthenticated, isLoading } = useConvexAuth();
  const saveOnComplete = () => {
    localStorage.setItem(
      "countdownDone",
      JSON.stringify({
        done: true,
        roomId,
        roomPlaytimeId,
        seconds: SECONDS,
        at: Date.now(),
      })
    );
  };

  const roomData = useQuery(
    api.rooms.getRoomById,
    isLoading || !isAuthenticated
      ? "skip"
      : {
          id: roomId as Id<"rooms">,
          roomPlaytimeId: roomPlaytimeId as Id<"roomPlaytimes">,
        }
  );

  const riddle = useQuery(
    api.riddles.getRiddleById,
    roomData && roomData.roomPlaytime?.currentRiddle
      ? { id: roomData.roomPlaytime?.currentRiddle }
      : "skip"
  );

  //   const getAcceptedAnswers = (): string[] => {
  //     const raw = riddle?.answer;
  //     if (raw == null) return [];
  //     return Array.isArray(raw) ? raw.map((a) => String(a)) : [String(raw)];
  //   };

  useEffect(() => {
    if (riddle) return;
    try {
      // give the timer a moment to mount if you remount via key (not strictly necessary)
      if (timerRef.current?.reset) {
        timerRef.current.reset(roomData?.settings?.riddleTimeSpan);
        timerRef.current.start?.();
      }
    } catch (err) {
      console.warn(
        "Timer control methods not available on ref — falling back to key remount.",
        err
      );
    }
  }, [riddle, roomData?.settings?.riddleTimeSpan, riddle?._id]);

  useEffect(() => {
    if (countdownDone) {
      timerRef.current?.start();
    }
  }, [countdownDone]);

  //   console.log("countdownDone: ", true);
  //   console.log("roomData: ", roomData);

  return (
    <div>
      {roomData ? (
        <div className="relative w-full h-full">
          <>
            {countdownDone && (
              <Countdown
                fullscreen
                onComplete={() => {
                  setCountdownDone(true);
                  saveOnComplete();
                }}
                seconds={SECONDS}
              />
            )}
            <header className="w-full fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-green-400/10 border-b border-primary/50">
              <div className="flex items-center gap-2">
                <div>
                  <Avatar
                    size={isMd ? 70 : 50}
                    className="lg:!text-3xl !text-xl !bg-gradient-to-r !from-[#5e2731] !to-[#c21534]"
                  >
                    {roomData.room.name?.charAt(0) || "Unk"}
                  </Avatar>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1 max-md:text-xs">
                    <span className="text-primary max-md:text-xs font-medium">
                      Name:{" "}
                    </span>
                    <span className="capitalize">{roomData.room.name}</span>
                  </div>
                  <div className="flex items-center gap-1 max-md:text-xs">
                    <span className="text-primary max-md:text-xs font-medium">
                      Code:{" "}
                    </span>
                    <span className="capitalize">{roomData.room.code}</span>
                    <CopyButton
                      text={roomData.room.code}
                      children=""
                      className="rounded-full cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1 max-md:text-xs">
                    <span className="text-primary max-md:text-xs font-medium">
                      Ready:{" "}
                    </span>
                    <span className="">{roomData.readyPlayers} pl.</span>
                  </div>
                </div>
              </div>

              <div className="flex max-md:flex-col md:flex-row-revers/e md:gap-1 items-center">
                <Avatar
                  size={50}
                  src={roomData.user.image}
                  className="!border !border-primary/50 cursor-pointer"
                />
                <span className="max-md:text-xs">You</span>
              </div>
            </header>
          </>

          <div className="flex flex-row max-lg:flex-col-reverse gap-1 p-1 w-full items-start h-full overflow-auto scrollbar max-lg:justify-end">
            <div className="w-full lg:w-2/3 lg:h-full">
              <div className="w-full">
                <TimerProgressBar
                  key={roomData.roomPlaytime?.currentRiddle ?? "timer"}
                  ref={timerRef}
                  autoStart={false}
                  duration={roomData.settings.riddleTimeSpan}
                  muted
                  onComplete={() => {}}
                  fillColor="#f84565"
                  trackColor="#000000"
                  className="border border-primary"
                />
              </div>

              <div className="flex flex-col w-full my-5 py-5">
                {riddle ? (
                  <div className="flex flex-col gap-y-5 w-full items-center-safe">
                    <div className="flex flex-col gap-y-5 w-full items-center-safe">
                      <span className="text-center text-pretty font-medium -tracking-tighter lg:text-2xl">
                        {riddle.text}
                      </span>

                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="border-primary border w-full lg:w-9/12 h-10 rounded-3xl pl-7 !outline-none !shadow-primary placeholder:text-primary text-primary"
                        placeholder="Type answer here..."
                      />
                    </div>

                    {riddle.choices && riddle.choices.length > 0 && (
                      <div className="flex flex-col items-center w-full lg:w-9/12 mt-4">
                        <div className="w-full mb-3">
                          <strong className="text-sm">
                            Or pick one (multiple choice):
                          </strong>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full justify-center max-h-[50dvh] overflow-y-auto scroll-smooth scrollbar">
                          {shuffle(riddle.choices || [])?.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => {}}
                              className="max-lg:px-2 max-lg:py-1 px-4 py-2 rounded-md border border-primary bg-black text-primary capitalize hover:bg-primary-dul active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition font-medium cursor-pointer"
                              //   disabled={proceeding}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <LoadingDots color="#f84565" size={20} />
                )}
              </div>

              <div className="flex items-center justify-between px-5 w-full mt-2">
                <Button
                  size={isMd ? "middle" : "small"}
                  variant="outlined"
                  //   onClick={open}
                  //   loading={closing}
                  //   disabled={closing}
                  className="!text-white !bg-black !max-lg:p-2"
                >
                  <span className="max-md:text-xs">Quit</span>
                </Button>
                <div className="flex items-center gap-x-3">
                  <Button
                    size={isMd ? "middle" : "small"}
                    variant="outlined"
                    // onClick={handleSkip}
                    className="!text-white !bg-black !max-lg:p-2"
                  >
                    <span className="max-md:text-xs">Skip</span>
                  </Button>
                  <Button
                    size={isMd ? "middle" : "small"}
                    // loading={proceeding}
                    // disabled={proceeding}
                    className="!text-white !bg-primary flex items-center !max-lg:p-2"
                    // onClick={handleNext}
                  >
                    <span className="max-md:text-xs">Next</span>
                    <ChevronRightIcon className="bounce-x" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-lg:w-full max-lg:mb-5 max-lg:pb-5 max-lg:border-b w-1/3 flex gap-1 lg:gap-3 flex-col lg:p-2 lg:h-full lg:border-l border-dashed border-l-primary">
              <span className="relative lg:text-xl max-lg:text-xs max-lg:pb-1 font-medium self-center-safe lg:pb-3 w-full text-center border-dashed border-b border-primary">
                <span>ScoreBoard</span>
                <Tooltip title="Quit">
                  <button className="absolute cursor-pointer hover:scale-100 p-1.5 rounded-full bg-primary/20 hover:bg-primary/30 active:scale-95 transition duration-100 -top-1.5 right-1.5">
                    <XIcon className="size-3 lg:size-5 " />
                  </button>
                </Tooltip>
              </span>

              <div className="">
                <div className="flex flex-col justify-center gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-medium">Corrects</span>
                    <span className="text-primary font-medium">Incorrects</span>
                    <span className="text-amber-400 font-medium">Skipped</span>
                    <span className="text-sky-400 font-medium">TimedOut</span>
                  </div>
                  <div className="grid grid-cols-4 place-content-center">
                    <span className="text-green-400 font-medium text-center">
                      0
                    </span>
                    <span className="text-primary font-medium text-center">
                      0
                    </span>
                    <span className="text-amber-400 font-medium text-center">
                      0
                    </span>
                    <span className="text-sky-400 font-medium text-center">
                      0
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-lg:hidden lg:flex lg:flex-col w-full debug h-full overflow-auto scrollbar"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col h-full items-center justify-center">
          <LoadingDots color="#f84565" size={20} />
        </div>
      )}
    </div>
  );
};
export default RoomPlaytime;
