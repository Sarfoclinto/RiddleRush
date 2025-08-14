import BlurCircle from "@/components/BlurCircle";
import useFetch from "@/hooks/useFetch";
import useScreenSize from "@/hooks/useScreenSize";
import type { Riddle } from "@/types/common";
import type { RequestError } from "@/types/error";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRandomRiddle } from "./api";
import { queryKeys } from "@/assets/queryKeys";
import { Collapse, ConfigProvider, type CollapseProps } from "antd";
import { useMemo } from "react";
import LoadingDots from "@/components/LoadingDots";

const LandingPage = () => {
  const { isMd } = useScreenSize();
  const navigate = useNavigate();

  const { data: riddle, isLoading } = useFetch<Riddle, RequestError>({
    queryFn: getRandomRiddle,
    title: "Random riddle",
    queryKeys: [`${queryKeys.RANDOMRIDDLE}`],
  });

  const item: CollapseProps["items"] = useMemo(() => {
    return [
      {
        key: "riddle",
        label: (
          <span className="flex items-center justify-between">
            <span className="text-primary font-medium text-pretty">
              {isLoading ? (
                <div className="h-3 w-30 rounded animate-pulse bg-primary/10" />
              ) : (
                riddle?.riddle
              )}
            </span>
            {isLoading && <LoadingDots />}
          </span>
        ),
        children: (
          <span className="text-red-400 flex items-center justify-center text-center w-full">
            {riddle?.answer}
          </span>
        ),
      },
    ];
  }, [isLoading, riddle?.answer, riddle?.riddle]);
  return (
    <div className="min-w-full min-h-dvh flex flex-col items-center justify-center overflow-hidden">
      <>
        <BlurCircle
          top={isMd ? "200px" : "0"}
          left={isMd ? "200px" : "0"}
          size={isMd ? "lg" : "md"}
          animate
          type="bounce"
        />
        <BlurCircle
          bottom={isMd ? "200px" : "0"}
          right={isMd ? "200px" : "0"}
          animate
        />
        <BlurCircle animate size={isMd ? "xl" : "lg"} />
      </>

      <div className="flex flex-col gap-2 mb-5">
        <p className="font-semibold text-xl text-left -tracking-tighter">
          WELCOME TO
        </p>
        <p className="font-bold text-8xl">
          Riddle <span className="text-primary">Rush</span>
        </p>
        <p className="text-lg text-gray-200 text-center font-medium">
          Find your next adventure
        </p>
      </div>
      <button
        onClick={() => navigate("/home")}
        className="bg-primary w-fit flex items-center justify-center gap-2 mb-5 px-4 sm:py-3 sm:px-6 hover:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer"
      >
        Get Started
        <span>
          <ArrowRight className="bounce-x" />
        </span>
      </button>

      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              contentBg: "#000",
            },
          },
        }}
      >
        <div className="max-w-11/12">
          <Collapse
            items={item}
            className="mt-10 max-sm:w-11/12 shadow border-2 !border-primary"
          />
        </div>
      </ConfigProvider>
    </div>
  );
};
export default LandingPage;
