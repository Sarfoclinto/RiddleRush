import type { HeaderPlaytime } from "@/types/common";
// import Header from "./Header";
import { Collapse, ConfigProvider, type CollapseProps } from "antd";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import ScoreBar from "./ScoreBar";
import { XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingDots from "./LoadingDots";
import ClapAudio from "./ClapAudio";
import clap from "/clap.mp3";
import FallingParticles from "./FallingParticles";

type SinglePlayedProps = {
  playtime: HeaderPlaytime;
};
const SinglePlayed = ({ playtime }: SinglePlayedProps) => {
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  // durations in milliseconds
  const clapDuration = 9500;
  const particlesDuration = 9500;

  // fallback UI when autoplay blocked
  // const [autoplayFailed, setAutoplayFailed] = useState(false);

  const riddleDetails = useQuery(api.playtime.getPlaytimeRiddlesDetails, {
    id: playtime._id,
  });
  const riddles: CollapseProps["items"] = useMemo(() => {
    return riddleDetails?.map((riddle) => {
      const wasCorrect = riddle?._id
        ? playtime.corrects?.includes(riddle._id as string)
        : false;
      const wasWrong = riddle?._id
        ? playtime.incorrects?.includes(riddle._id as string)
        : false;
      return {
        key: riddle?._id,
        label: (
          <span className="text-primary font-medium w-full text-pretty">
            {riddle?.text}
          </span>
        ),
        children: (
          <span
            className={`${wasCorrect ? "text-[#00ee20]" : wasWrong ? "text-primary-dull" : "text-[#f59e0b]"} text-pretty flex items-center justify-center text-center w-full`}
          >
            {riddle?.answer}
          </span>
        ),
      };
    });
  }, [playtime.corrects, playtime.incorrects, riddleDetails]);

  const completeAndClose = useMutation(api.playtime.completePlaytime);

  const handleClose = async () => {
    try {
      setClosing(true);
      await completeAndClose({ playtimeId: playtime._id });
      setClosing(false);
      navigate("/home");
    } catch (error) {
      console.error("error closing playtime: ", error);
    }
  };
  return (
    <div className="relative flex flex-col gap-y-3 items-center lg:justify-center w-full h-full text-xl font-medium text-primary overflow-auto">
      <>
        <ClapAudio
          src={clap}
          durationMs={clapDuration}
          volume={0.8}
          autoplay={true}
          onEnd={() => {
            // no-op or analytics
          }}
        />
        <FallingParticles
          durationMs={particlesDuration}
          particleCount={45}
          colors={[
            "#FF4D6D",
            "#FFB86B",
            "#FFD36B",
            "#6BFFB8",
            "#6BC7FF",
            "#A56BFF",
          ]}
          sizeRange={[14, 34]}
          zIndex={1200}
          fullScreen={true}
        />
      </>
      {/* <Header playtime={playtime} showProgress={false} /> */}
      <button
        onClick={handleClose}
        className="absolute cursor-pointer transition-all duration-100 max-md:-top-1 active:bg-primary/30 max-md:right-2 top-0 right-0 max-md:p-2.5 active:shadow-none hover:scale-95 p-3 rounded-full shadow-primary shadow bg-black text-primary flex items-center justify-center"
      >
        {closing ? (
          <LoadingDots inline color="#f84565" size={10} />
        ) : (
          <XIcon className="max-md:size-3" />
        )}
      </button>
      <span>Completed</span>
      <div className="max-w-11/12 w-11/12 max-md:w-11/12 mb-5">
        <ScoreBar
          correct={playtime.corrects?.length || 0}
          incorrect={playtime.incorrects?.length || 0}
          skipped={playtime.skipped?.length || 0}
        />
      </div>
      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              contentBg: "#000",
            },
          },
        }}
      >
        <div className="max-w-[95%] w-[95%] max-md:[95%] flex flex-col items-center justify-center max-h-[calc(100dvh-35dvh)] overflow-y-auto scroll-smooth scrollbar">
          <Collapse
            items={riddles}
            accordion
            className="mt-10 max-sm:w-11/12 shadow border-2 !border-primary"
          />
        </div>
      </ConfigProvider>
    </div>
  );
};
export default SinglePlayed;
