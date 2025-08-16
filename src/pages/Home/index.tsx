import Particles from "@/components/Particles";
import { useClerk, useUser } from "@clerk/clerk-react";
import { message } from "antd";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );

  const onCreateRoom = () => {
    if (isSignedIn) {
      navigate("/room/create");
    } else {
      toast("Please sign in first", "info");
      openSignIn();
    }
  };
  return (
    <div className="relative min-h-full h-full overflow-hidden">
      <Particles />
      {contextHolder}
      <div className="relative h-full z-10 flex flex-col items-center justify-center gap-y-5 overflow-hidden">
        <p className="text-3xl font-medium font-serif">
          Choose your adventure...
        </p>
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigate("/alone/config")}
            className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer"
          >
            Play Alone
          </button>
          <button
            onClick={onCreateRoom}
            className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer"
          >
            Create Room
          </button>
          <button className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer">
            Join room
          </button>
        </div>
      </div>
    </div>
  );
};
export default Home;
