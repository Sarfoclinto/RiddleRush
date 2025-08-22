import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Particles from "./Particles";
import AntConfig from "./AntConfig";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

const Layout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const hasLiveRoom = useQuery(
    api.users.hasPlayingRoom,
    isLoading || !isAuthenticated ? "skip" : {}
  );
  const isPlayingRoom =
    pathname.includes("room") && pathname.includes("playtime");
  useEffect(() => {
    if (hasLiveRoom && hasLiveRoom.ok) {
      navigate(
        `/room/${hasLiveRoom.roomId}/playtime/${hasLiveRoom.roomPlaytimeId}`
      );
    }
  }, [hasLiveRoom, navigate]);

  return (
    <div className="flex flex-col">
      {!isPlayingRoom && <Navbar />}
      <div className="p-5 pt-30 h-dvh relative overflow-hidden">
        <Particles />
        <AntConfig>
          <Outlet />
        </AntConfig>
      </div>
    </div>
  );
};
export default Layout;
