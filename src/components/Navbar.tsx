import { Link, useNavigate } from "react-router-dom";
import { HouseIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { assets } from "@/assets/assets";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NotificationBell } from "./NotificationBell";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { isLoading, isAuthenticated } = useConvexAuth();

  const notifications = useQuery(
    api.notification.getMyUnreadNotifications,
    isLoading || !isAuthenticated ? "skip" : {}
  );

  const toggleMenu = () => setIsOpen(!isOpen);
  const linkOnClick = () => {
    scrollTo(0, 0);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="w-36 h-auto" />
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${
          isOpen ? "max-md:w-full" : "max-md:w-0"
        }`}
      >
        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={toggleMenu}
        />
        <Link onClick={linkOnClick} to="/home">
          Home
        </Link>
        <Link onClick={linkOnClick} to="/room/join">
          Rooms
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <NotificationBell
          soundPlayMode="once"
          playSound={true}
          unreadCount={notifications?.length}
          hasUnread={(notifications || [])?.length > 0}
          // hasUnread={false}
          onClick={() => navigate("/me/notifications")}
        />
        {!user ? (
          <button
            onClick={() => openSignIn()}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <div className="shadow rounded-full p-2 shadow-primary">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Rooms"
                  labelIcon={<HouseIcon width={15} />}
                  onClick={() => {
                    navigate("/me/my-rooms");
                  }}
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        )}
      </div>
      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={toggleMenu}
      />
    </div>
  );
};
export default Navbar;
