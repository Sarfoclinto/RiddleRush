import Countdown from "@/components/Countdown";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "myconvex/_generated/dataModel";
import { Avatar, Button, message, Tooltip } from "antd";
import LoadingDots from "@/components/LoadingDots";
import useScreenSize from "@/hooks/useScreenSize";
import CopyButton from "@/components/CopyButton";
import { ChevronRightIcon, XIcon } from "lucide-react";
import TimerProgressBar from "@/components/TImeProgressBar";
import type { TimerProgressBarHandle } from "@/types/common";
// import { shuffle } from "@/utils/riddleFns";
import PlayerAvatar from "@/components/PlayerAvatar";
import { computeScores } from "@/utils/fns";
import GlowingText from "@/components/GlowingText";
import { isAnswerCorrect } from "@/utils/riddleFns";
import { useDisclosure } from "@/hooks/useDisclosure";
import DeleteOrQuitModal from "../Alone/components/DeleteOrQuitModal";
import { capitalize } from "@/utils/fns";

const SECONDS = 5;
const RoomPlaytime = () => {
  const { isMd } = useScreenSize();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const timerRef = useRef<TimerProgressBarHandle | null>(null);
  const [value, setValue] = useState("");
  const { open, isOpen, close } = useDisclosure();
  const [quiting, setQuiting] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const skipInProgressRef = useRef<boolean>(false); // guard so we don't double-skip
  const [countdownDone, setCountdownDone] = useState(() => {
    if (typeof window === "undefined") return false;
    const val = localStorage.getItem("countdownDone");
    if (!val) return false;
    try {
      const parsed = JSON.parse(val);
      // it parsed.at is more than 1 minute ago return as true
      if (parsed && parsed.at && Date.now() - parsed.at > 60 * 1000) {
        return true;
      }
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

  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );

  const { roomId, roomPlaytimeId } = useParams<{
    roomId: Id<"rooms">;
    roomPlaytimeId: Id<"roomPlaytimes">;
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

  // queries
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

  // mutations
  const advance = useMutation(api.roomPlaytime.advancePlaytime);
  const quitAndLeave = useMutation(api.users.quitAndLeaveRoom);

  const getAcceptedAnswers = (): string[] => {
    const raw = riddle?.answer;
    if (raw == null) return [];
    return Array.isArray(raw) ? raw.map((a) => String(a)) : [String(raw)];
  };

  const turn = useMemo(() => {
    const user = roomData?.readyPlayersDetails.find(
      (pl) => pl.userId === roomData.roomPlaytime?.currentUser
    );
    return user;
  }, [roomData]);

  const plays = roomData?.roomPlaytime?.play;
  const scores = useMemo(() => computeScores(plays), [plays]);

  // const myUserId = roomData?.user._id;
  // const myScores = useMemo(
  //   () =>
  //     myUserId
  //       ? computeScores(plays, myUserId)
  //       : { correct: 0, incorrect: 0, skipped: 0, timedOut: 0, total: 0 },
  //   [plays, myUserId]
  // );

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

  // useEffect(() => {
  //   if (turn && turn.user) {
  //     toast(`It is ${capitalize(turn.user?.username)}'s turn`, "info");
  //   }
  // }, [riddle?._id, toast, turn]);

  useEffect(() => {
    if (countdownDone) {
      timerRef.current?.start();
    }
  }, [countdownDone]);

  useEffect(() => {
    if (roomData?.roomPlaytime?.completed) {
      localStorage.removeItem("countdownDone");
      navigate(`/room/scores/${roomId}/${roomPlaytimeId}`);
    }
  }, [navigate, roomData?.roomPlaytime?.completed, roomId, roomPlaytimeId]);

  // AUTO-SKIP function used by timer onComplete and can be reused by Skip button
  const autoSkip = useCallback(
    async (reason: "skipped" | "timedOut" = "timedOut") => {
      if (skipInProgressRef.current) return;
      skipInProgressRef.current = true;
      setProceeding(true);
      try {
        await advance({
          playtimeId: roomData?.roomPlaytime?._id as Id<"roomPlaytimes">,
          result: reason,
        });
        toast("Time's up — skipped!", "info");
        setValue("");
      } catch (err) {
        console.error("autoSkip error:", err);
        toast("Sorry an error occured", "error");
      } finally {
        setProceeding(false);
        skipInProgressRef.current = false;
      }
    },
    [advance, roomData?.roomPlaytime?._id, toast]
  );

  const isMyTurn = roomData?.user._id === roomData?.roomPlaytime?.currentUser;
  const disable = !isMyTurn || !isAuthenticated || proceeding;

  if (!roomData || !roomData.roomPlaytime) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-primary">
        <LoadingDots dotCount={5} color="#f84565" size={isMd ? 30 : 20} />
      </div>
    );
  }

  // handlers
  const handleNext = async () => {
    try {
      setProceeding(true);
      if (!value) {
        toast("Please enter your answer", "info");
        return;
      }
      if (roomData.roomPlaytime?._id) {
        const accepted = getAcceptedAnswers();
        const correct = isAnswerCorrect(value, accepted);
        if (correct) {
          await advance({
            playtimeId: roomData.roomPlaytime._id,
            result: "correct",
          });
          toast("Correct!", "success");
        } else {
          await advance({
            playtimeId: roomData.roomPlaytime._id,
            result: "incorrect",
          });
          toast("Incorrect!", "error");
        }
      } else {
        toast("Sorry, an error occurred", "error");
      }
      // stop or reset timer to prevent a pending onComplete firing after we navigated
      try {
        timerRef.current?.stop?.();
      } catch (err) {
        console.error("timer stop error:", err);
      }
      setValue("");
    } catch (error) {
      console.error("Sorry an error occurred: ", error);
      toast("Sorry an error occured", "error");
    } finally {
      setProceeding(false);
    }
  };

  const handleSkip = async () => {
    await autoSkip("skipped");
  };

  const handleTimedOut = async () => {
    await autoSkip("timedOut");
  };

  const handleOptionClick = async (choice: string) => {
    setValue(choice);
    setProceeding(true);
    try {
      if (roomData.roomPlaytime?._id) {
        const accepted = getAcceptedAnswers();
        const correct = isAnswerCorrect(choice, accepted);
        if (correct) {
          await advance({
            playtimeId: roomData?.roomPlaytime?._id,
            result: "correct",
          });
          toast("Correct!", "success");
        } else {
          await advance({
            playtimeId: roomData.roomPlaytime._id,
            result: "incorrect",
          });
          toast("Incorrect!", "error");
        }
      } else {
        toast("Sorry, an error occurred", "error");
      }
      // stop or reset timer to prevent a pending onComplete firing after we navigated
      try {
        timerRef.current?.stop?.();
      } catch (err) {
        console.error("timer stop error:", err);
      }
      setValue("");
    } catch (err) {
      toast("Sorry an error occured", "error");
      console.error(err);
    } finally {
      setProceeding(false);
    }
  };

  const handleQuit = async () => {
    try {
      setQuiting(true);
      const res = await quitAndLeave({
        roomId: roomData.room._id,
      });
      toast(res.message);
      close();
      navigate("/home");
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setQuiting(false);
    }
  };

  //   console.log("countdownDone: ", true);
  // console.log("roomData: ", roomData);

  return (
    <div className="w-full h-full">
      {contextHolder}
      {roomData ? (
        <div className="relative w-full h-full">
          <>
            {!countdownDone && (
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
                  onComplete={handleTimedOut}
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
                        disabled={!isMyTurn}
                        onChange={(e) => setValue(e.target.value)}
                        className="border-primary border w-full disabled:bg-primary-dull/10 disabled:cursor-no-drop lg:w-9/12 h-10 rounded-3xl pl-7 !outline-none !shadow-primary placeholder:text-primary text-primary"
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
                          {(riddle.choices || [])?.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleOptionClick(opt)}
                              className="max-lg:px-2 max-lg:py-1 px-4 py-2 rounded-md border border-primary bg-black text-primary capitalize hover:bg-primary-dul active:bg-primary-dull duration-200 not-disabled:hover:shadow-[0_0_20px_#f84565] not-disabled::active:shadow-[0_0_20px_#f84565] not-disabled::active:scale-95 transition font-medium cursor-pointer disabled:cursor-no-drop disabled:bg-primary-dull/10"
                              disabled={disable}
                            >
                              {proceeding ? (
                                <LoadingDots color="#f84565" inline size={5} />
                              ) : (
                                opt
                              )}
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

              {isMyTurn ? (
                <div className="flex items-center justify-between px-5 w-full mt-2">
                  <Button
                    size={isMd ? "middle" : "small"}
                    variant="outlined"
                    onClick={open}
                    loading={quiting}
                    disabled={quiting || proceeding}
                    className="!text-white !bg-black !max-lg:p-2"
                  >
                    <span className="max-md:text-xs">Quit</span>
                  </Button>
                  <div className="flex items-center gap-x-3">
                    <Button
                      size={isMd ? "middle" : "small"}
                      variant="outlined"
                      disabled={proceeding}
                      onClick={handleSkip}
                      className="!text-white !bg-black !max-lg:p-2"
                    >
                      <span className="max-md:text-xs">Skip</span>
                    </Button>
                    <Button
                      size={isMd ? "middle" : "small"}
                      loading={proceeding}
                      disabled={proceeding}
                      className="!text-white !bg-primary flex items-center !max-lg:p-2"
                      onClick={handleNext}
                    >
                      <span className="max-md:text-xs">Next</span>
                      <ChevronRightIcon className="bounce-x" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mx-auto mt-auto">
                  <GlowingText
                    isPlaying={true}
                    text={
                      isMyTurn
                        ? "It's your turn"
                        : `It's ${capitalize(turn?.user?.username || "")} turn`
                    }
                    glowColor="#00d4ff" // optional
                    pulseDuration={1.25} // optional (seconds)
                    size="md" // 'sm' | 'md' | 'lg' | number(px)
                    fixedBottom={false} // set false if you want inline behavior
                    className="!cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="max-lg:w-full max-lg:mb-5 max-lg:pb-5 max-lg:border-b w-1/3 flex gap-1 lg:gap-3 flex-col lg:p-2 lg:h-full lg:border-l border-dashed border-l-primary">
              <span className="relative lg:text-xl max-lg:text-xs max-lg:pb-1 font-medium self-center-safe lg:pb-3 w-full text-center border-dashed border-b border-primary">
                <span>ScoreBoard</span>
                <Tooltip title="Quit">
                  <button
                    onClick={open}
                    className="absolute cursor-pointer hover:scale-100 p-1.5 rounded-full bg-primary/20 hover:bg-primary/30 active:scale-95 transition duration-100 -top-1.5 right-1.5"
                  >
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
                      {scores.correct}
                    </span>
                    <span className="text-primary font-medium text-center">
                      {scores.incorrect}
                    </span>
                    <span className="text-amber-400 font-medium text-center">
                      {scores.skipped}
                    </span>
                    <span className="text-sky-400 font-medium text-center">
                      {scores.timedOut}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-auto scrollbar flex items-center justify-center gap-x-3 p-1">
                {roomData.readyPlayersDetails.map((player) => {
                  const isCurrentPlayer =
                    player.userId === roomData.roomPlaytime?.currentUser;
                  return (
                    <PlayerAvatar
                      player={player}
                      key={player._id}
                      isPlaying={isCurrentPlayer}
                    />
                  );
                })}
              </div>

              {/* <div className="max-lg:hidden lg:flex lg:flex-col w-full debug h-full overflow-auto scrollbar"></div> */}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col h-full items-center justify-center">
          <LoadingDots color="#f84565" size={20} />
        </div>
      )}

      <DeleteOrQuitModal
        action={handleQuit}
        close={close}
        isOpen={isOpen}
        loading={quiting}
        title="Quit game and room"
        message="Are you sure you want to quit this game and room?. This action is irreversible"
      />
    </div>
  );
};
export default RoomPlaytime;
