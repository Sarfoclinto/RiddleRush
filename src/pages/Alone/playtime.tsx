import LoadingDots from "@/components/LoadingDots";
import { api } from "../../../convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimerProgressBarHandle } from "@/types/common";
import TimerProgressBar from "@/components/TImeProgressBar";
import { Button, message } from "antd";
import useScreenSize from "@/hooks/useScreenSize";
import { ChevronRightIcon } from "lucide-react";
import SinglePlayed from "@/components/SinglePlayed";
import { isAnswerCorrect, shuffle } from "@/utils/riddleFns";
import { useDisclosure } from "@/hooks/useDisclosure";
import DeleteOrQuitModal from "./components/DeleteOrQuitModal";
// import tick from "/tick.mp3";

const Playtime = () => {
  const { id } = useParams();
  const timerRef = useRef<TimerProgressBarHandle | null>(null);
  const { isMd } = useScreenSize();
  const [value, setValue] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [proceeding, setProceeding] = useState(false);
  const [closing, setClosing] = useState(false);
  const skipInProgressRef = useRef<boolean>(false); // guard so we don't double-skip
  const navigate = useNavigate();
  const { close, isOpen, open } = useDisclosure();
  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );

  const playtimes = useQuery(
    api.playtime.getPlaytimeById,
    id ? { id: id as Id<"playtimes"> } : "skip"
  );

  const riddle = useQuery(
    api.riddles.getRiddleById,
    playtimes && playtimes.current
      ? { id: playtimes?.current as Id<"riddles"> }
      : "skip"
  );

  const advance = useMutation(api.playtime.advancePlaytime);
  const completeAndClose = useMutation(api.playtime.completePlaytime);

  const sum = useMemo(() => {
    return (
      (playtimes?.corrects?.length || 0) +
      (playtimes?.incorrects?.length || 0) +
      (playtimes?.skipped?.length || 0)
    );
  }, [playtimes]);

  const getAcceptedAnswers = (): string[] => {
    const raw = riddle?.answer;
    if (raw == null) return [];
    return Array.isArray(raw) ? raw.map((a) => String(a)) : [String(raw)];
  };

  // AUTO-SKIP function used by timer onComplete and can be reused by Skip button
  const autoSkip = useCallback(async () => {
    if (skipInProgressRef.current) return;
    skipInProgressRef.current = true;
    setProceeding(true);
    try {
      await advance({
        playtimeId: playtimes?._id as Id<"playtimes">,
        result: "skipped",
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
  }, [advance, playtimes?._id, toast]);

  // Ensure timer resets/starts when a new riddle arrives.
  useEffect(() => {
    if (!riddle) return;
    // 1) If the TimerProgressBar exposes a reset(start) method, call it:
    try {
      // give the timer a moment to mount if you remount via key (not strictly necessary)
      if (timerRef.current?.reset) {
        timerRef.current.reset(playtimes?.secondsPerRiddle);
        timerRef.current.start?.();
      }
    } catch (err) {
      console.warn(
        "Timer control methods not available on ref — falling back to key remount.",
        err
      );
    }
    // If you use key remount (below), React will remount the timer anyway and it will start fresh.
  }, [riddle?._id, playtimes?.secondsPerRiddle, riddle]);

  if (!playtimes) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-primary">
        <LoadingDots dotCount={5} color="#f84565" size={isMd ? 30 : 20} />
      </div>
    );
  }

  if (sum === playtimes.riddles.length) {
    return <SinglePlayed playtime={playtimes} />;
  }

  const handleClose = async () => {
    try {
      setClosing(true);
      await completeAndClose({ playtimeId: playtimes._id });
      setClosing(false);
      close();
      navigate("/home");
    } catch (error) {
      console.error("error closing playtime: ", error);
    }
  };
  // Updated handleSkip to reuse autoSkip guard
  const handleSkip = async () => {
    // reuse autoSkip behaviour, but call it directly so messages are consistent
    await autoSkip();
  };
  const handleNext = async () => {
    setProceeding(true);
    try {
      if (!value) {
        toast("Please enter your answer", "info");
        return;
      }
      const accepted = getAcceptedAnswers();
      const correct = isAnswerCorrect(value, accepted);
      if (correct) {
        await advance({ playtimeId: playtimes?._id, result: "correct" });
        toast("Correct!", "success");
      } else {
        await advance({ playtimeId: playtimes?._id, result: "incorrect" });
        toast("Incorrect!", "error");
      }
      // stop or reset timer to prevent a pending onComplete firing after we navigated
      try {
        timerRef.current?.stop?.();
      } catch (err) {
        console.error("timer stop error:", err);
      }
      setValue("");
    } catch (error) {
      toast("Sorry an error occured", "error");
      console.error(error);
    } finally {
      setProceeding(false);
    }
  };

  // const handleSkip = async () => {
  //   setProceeding(true);
  //   try {
  //     await advance({ playtimeId: playtimes?._id, result: "skipped" });
  //     toast("Skipped!", "info");
  //     setValue("");
  //     return;
  //   } catch (error) {
  //     toast("Sorry an error occured", "error");
  //     console.error(error);
  //   } finally {
  //     setProceeding(false);
  //   }
  // };

  const handleOptionClick = async (choice: string) => {
    setValue(choice);
    setProceeding(true);
    try {
      const accepted = getAcceptedAnswers();
      const correct = isAnswerCorrect(choice, accepted);
      if (correct) {
        await advance({ playtimeId: playtimes?._id, result: "correct" });
        toast("Correct!", "success");
      } else {
        await advance({ playtimeId: playtimes?._id, result: "incorrect" });
        toast("Incorrect!", "error");
      }
      setValue("");
    } catch (err) {
      toast("Sorry an error occured", "error");
      console.error(err);
    } finally {
      setProceeding(false);
    }
  };
  return (
    <div className="flex w-full flex-col h-full items-center justify-center">
      {contextHolder}
      {playtimes ? (
        <div className="flex w-full flex-col h-full items-center">
          <span className="text-xl capitalize py-2 font-bold font-serif flex items-center gap-x-3">
            <span className="text-primary">Username: </span>
            <span>{playtimes?.user?.username}</span>
          </span>
          <div className="w-10/12 font-medium">
            <TimerProgressBar
              key={riddle?._id ?? "timer"}
              ref={timerRef}
              duration={playtimes.secondsPerRiddle}
              autoStart={false}
              muted={true}
              // tickSoundUrl={tick}
              // onTick={(remaining) => {
              //   // optional: update UI or play tick sound
              //   // console.log("remaining", remaining);
              // }}
              onComplete={() => {
                autoSkip();
              }}
              showTime={true}
              fillColor="#f84565"
              trackColor="#000000"
              height="18px"
              className="border border-primary"
            />
          </div>
          <div className="w-10/12 grid grid-cols-2 lg:grid-cols-4 items-center justify-center py-2">
            <div className="flex items-center justify-center gap-x-3">
              <span className="text-primary">Correct:</span>
              <span className="font-medium">
                {playtimes.corrects?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-center gap-x-3">
              <span className="text-primary">Incorrect:</span>
              <span className="font-medium">
                {playtimes.incorrects?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-center gap-x-3">
              <span className="text-primary">Skipped:</span>
              <span className="font-medium">
                {playtimes.skipped?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-center gap-x-3">
              <span className="text-primary">Total:</span>
              <span className="font-medium">
                {playtimes.riddles.length || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col w-10/12 my-5 py-5">
            {riddle ? (
              <div className="flex flex-col w-full items-center-safe">
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

                <div className="flex flex-col items-center w-full lg:w-9/12 mt-4">
                  <div className="w-full mb-3">
                    <strong className="text-sm">
                      Or pick one (multiple choice):
                    </strong>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full justify-center max-h-[50dvh] overflow-y-auto scroll-smooth scrollbar">
                    {riddle ? (
                      shuffle(riddle.choices || [])?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(opt)}
                          className="px-4 py-2 rounded-md border border-primary bg-black text-primary capitalize hover:bg-primary-dul active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition font-medium cursor-pointer"
                          disabled={proceeding}
                        >
                          {opt}
                        </button>
                      ))
                    ) : (
                      <LoadingDots color="#f84565" size={10} />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full lg:w-9/12 mt-2">
                  <Button
                    size={isMd ? "middle" : "small"}
                    variant="outlined"
                    onClick={open}
                    loading={closing}
                    disabled={closing}
                    className="!text-white !bg-black "
                  >
                    <span className="max-md:text-xs">Quit</span>
                  </Button>
                  <div className="flex items-center gap-x-3">
                    <Button
                      size={isMd ? "middle" : "small"}
                      variant="outlined"
                      onClick={handleSkip}
                      className="!text-white !bg-black "
                    >
                      <span className="max-md:text-xs">Skip</span>
                    </Button>
                    <Button
                      size={isMd ? "middle" : "small"}
                      loading={proceeding}
                      disabled={proceeding}
                      className="!text-white !bg-primary flex items-center capitalize"
                      onClick={handleNext}
                    >
                      <span className="max-md:text-xs">Next</span>
                      <ChevronRightIcon className="bounce-x" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <LoadingDots color="#f84565" size={30} />
            )}
          </div>
        </div>
      ) : (
        <LoadingDots color="#f84565" size={30} />
      )}
      <DeleteOrQuitModal
        action={handleClose}
        close={close}
        isOpen={isOpen}
        loading={closing}
      />
    </div>
  );
};
export default Playtime;
