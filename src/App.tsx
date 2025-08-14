import "@ant-design/v5-patch-for-react-19";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </>
  );
}
export default App;
