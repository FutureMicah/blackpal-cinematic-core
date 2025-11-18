import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subscribe from "./pages/Subscribe";
import SignUp from "./pages/SignUp";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import BlackBoard from "./pages/BlackBoard";
import BlackVault from "./pages/BlackVault";
import BlackVerse from "./pages/BlackVerse";
import BlackPass from "./pages/BlackPass";
import BlackForge from "./pages/BlackForge";
import BlackCoin from "./pages/BlackCoin";
import BlackNotify from "./pages/BlackNotify";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/blackboard" element={<BlackBoard />} />
          <Route path="/blackvault" element={<BlackVault />} />
          <Route path="/blackverse" element={<BlackVerse />} />
          <Route path="/blackpass" element={<BlackPass />} />
          <Route path="/blackforge" element={<BlackForge />} />
          <Route path="/blackcoin" element={<BlackCoin />} />
          <Route path="/blacknotify" element={<BlackNotify />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
