import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ContestLeaderboard } from "@/components/contest/ContestLeaderboard";
import { Trophy } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[hsl(var(--primary)/0.3)] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title="Live Rankings">
      <div className="max-w-md mx-auto space-y-5">
        <section className="relative rounded-3xl p-5 overflow-hidden text-white hero-gradient-violet">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)] opacity-10" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[18px] font-black tracking-tight">Contest Leaderboard</div>
              <div className="text-[11px] opacity-80">Top traders this week — climb to claim prizes</div>
            </div>
          </div>
        </section>

        <section className="glass-card p-3">
          <ContestLeaderboard />
        </section>
      </div>
    </AppShell>
  );
};

export default Leaderboard;
