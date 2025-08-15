import LoadingDots from "@/components/LoadingDots";
import { api } from "../../../convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import type { TimerProgressBarHandle } from "@/types/common";
import TimerProgressBar from "@/components/TImeProgressBar";
import { Button, message } from "antd";
import useScreenSize from "@/hooks/useScreenSize";
import { ChevronRightIcon } from "lucide-react";
import SinglePlayed from "@/components/SinglePlayed";
// import tick from "/tick.mp3";

const Playtime = () => {
  const { id } = useParams();
  const timerRef = useRef<TimerProgressBarHandle | null>(null);
  const { isMd } = useScreenSize();
  const [value, setValue] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [proceeding, setProceeding] = useState(false);

  const toast = (message?: string, type?: "success" | "error" | "info") => {
    messageApi.open({
      type: type ?? "success",
      content: message ?? "Successful",
    });
  };

  const playtimes = useQuery(
    api.playtime.getPlaytimeById,
    id ? { id: id as Id<"playtimes"> } : "skip"
  );
  const sum = useMemo(() => {
    return (
      (playtimes?.corrects?.length || 0) +
      (playtimes?.incorrects?.length || 0) +
      (playtimes?.skipped?.length || 0)
    );
  }, [playtimes]);

  const riddle = useQuery(
    api.riddles.getRiddleById,
    playtimes && playtimes.current
      ? { id: playtimes?.current as Id<"riddles"> }
      : "skip"
  );

  const advance = useMutation(api.playtime.advancePlaytime);

  if (!playtimes) {
    return <div>Sorry an error occurred: Playtime wasn't found</div>;
  }

  if (sum === playtimes.riddles.length) {
    return <SinglePlayed playtime={playtimes} />;
  }
  const handleNext = async () => {
    setProceeding(true);
    try {
      if (!value) {
        toast("Please enter your answer", "info");
        return;
      }
      if (riddle?.answer.includes(value)) {
        await advance({ playtimeId: playtimes?._id, result: "correct" });
        toast("Correct!", "success");
        setValue("");
        return;
      } else {
        await advance({ playtimeId: playtimes?._id, result: "incorrect" });
        toast("Incorrect!", "error");
        setValue("");
        return;
      }
    } catch (error) {
      toast("Sorry an error occured", "error");
      console.error(error);
    } finally {
      setProceeding(false);
    }
  };

  const handleSkip = async () => {
    setProceeding(true);
    try {
      await advance({ playtimeId: playtimes?._id, result: "skipped" });
      toast("Skipped!", "info");
      setValue("");
      return;
    } catch (error) {
      toast("Sorry an error occured", "error");
      console.error(error);
    } finally {
      setProceeding(false);
    }
  };

  console.log("playtimes: ", playtimes);
  console.log("riddle: ", riddle);
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
              ref={timerRef}
              duration={playtimes.secondsPerRiddle}
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

                <div className="flex items-center justify-between w-full lg:w-9/12 mt-2">
                  <div />
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
                      className="!text-white !bg-primary flex items-center"
                      onClick={handleNext}
                    >
                      <span className="max-md:text-xs">Next</span>
                      <ChevronRightIcon className="bounce-x" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <LoadingDots />
            )}
          </div>
        </div>
      ) : (
        <LoadingDots />
      )}
    </div>
  );
};
export default Playtime;
