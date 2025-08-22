import "@ant-design/v5-patch-for-react-19";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Rooms from "./pages/Rooms";
import Config from "./pages/Alone/config";
import Playtime from "./pages/Alone/playtime";
import CreateRoom from "./pages/Room/create";
import RoomSettings from "./pages/Room/settings";
import LoadRiddles from "./pages/Room/load";
import RoomPlayers from "./pages/Room/details";
import MyRooms from "./pages/Me/my-rooms";
import JoinRoom from "./pages/Room/join";
import MyNotification from "./pages/Me/notifications";
import RoomPlaytime from "./pages/Room/playtime";

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />

            {/* play alone */}
            <Route path="/alone/config" element={<Config />} />
            <Route path="/alone/playtime/:id" element={<Playtime />} />

            {/* room */}
            <Route path="/room/create" element={<CreateRoom />} />
            <Route path="/room/settings/:id" element={<RoomSettings />} />
            <Route path="/room/load/:id" element={<LoadRiddles />} />
            <Route path="/room/details/:id" element={<RoomPlayers />} />
            <Route path="/room/join" element={<JoinRoom />} />
            <Route path="/room/:roomId/playtime/:roomPlaytimeId" element={<RoomPlaytime />} />

            {/* me */}
            <Route path="/me/my-rooms" element={<MyRooms />} />
            <Route path="/me/notifications" element={<MyNotification />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </>
  );
}
export default App;
