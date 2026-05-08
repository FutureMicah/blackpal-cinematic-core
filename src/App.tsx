import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResetPassword from "./pages/ResetPassword";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import BlackTerminal from "./pages/BlackTerminal";
import ChartPage from "./pages/ChartPage";
import FuturesDashboard from "./pages/FuturesDashboard";
import AdminPanel from "./pages/AdminPanel";
import MyClaims from "./pages/MyClaims";
import Home from "./pages/Home";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terminal" element={<BlackTerminal />} />
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/futures" element={<FuturesDashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/claims" element={<MyClaims />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
