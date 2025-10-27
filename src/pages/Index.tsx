import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CinematicIntro } from "@/components/CinematicIntro";
import { Dashboard } from "@/components/Dashboard";
import { CustomCursor } from "@/components/CustomCursor";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <CustomCursor />
      {showIntro ? (
        <CinematicIntro onComplete={() => setShowIntro(false)} />
      ) : (
        <Dashboard />
      )}
    </>
  );
};

export default Index;
