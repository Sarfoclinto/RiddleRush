import type { HeaderPlaytime } from "@/types/common";
import Header from "./Header";
import { Collapse, ConfigProvider, type CollapseProps } from "antd";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type SinglePlayedProps = {
  playtime: HeaderPlaytime;
};
const SinglePlayed = ({ playtime }: SinglePlayedProps) => {
  const riddleDetails = useQuery(api.playtime.getPlaytimeRiddlesDetails, {
    id: playtime._id,
  });
  const riddles: CollapseProps["items"] = useMemo(() => {
    return riddleDetails?.map((riddle) => ({
      key: riddle?._id,
      label: (
        <span className="text-primary font-medium text-pretty">
          {riddle?.text}
        </span>
      ),
      children: (
        <span className="text-[#00ee20] flex items-center justify-center text-center w-full">
          {riddle?.answer}
        </span>
      ),
    }));
  }, [riddleDetails]);
  return (
    <div className="flex flex-col gap-y-3 items-center justify-center w-full h-full text-xl font-medium text-primary">
      <Header playtime={playtime} showProgress={false} />
      <span>Completed</span>
      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              contentBg: "#000",
            },
          },
        }}
      >
        <div className="max-w-11/12 w-11/12 max-md:w-11/12 flex flex-col ">
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
