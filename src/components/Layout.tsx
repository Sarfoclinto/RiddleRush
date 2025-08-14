import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Particles from "./Particles";
import AntConfig from "./AntConfig";

const Layout = () => {
  return (
    <div className="flex flex-col">
      <Navbar />
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
