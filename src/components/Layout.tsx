import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="p-5 pt-30 h-dvh">
        <Outlet />
      </div>
    </div>
  );
};
export default Layout;
