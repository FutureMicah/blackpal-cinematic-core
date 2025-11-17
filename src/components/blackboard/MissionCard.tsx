import { Clock, Zap, Coins } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description?: string;
    xp_reward: number;
    coin_reward: number;
    est_minutes: number;
    status: string;
    progress_percent: number;
  };
  onComplete: () => void;
}

export const MissionCard = ({ mission, onComplete }: MissionCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('complete_mission', {
        p_user_id: user.id,
        p_mission_id: mission.id
      });

      if (error) throw error;

      const result = data as { success: boolean; xp_awarded: number; coins_awarded: number };
      toast.success(`Mission Complete! +${result.xp_awarded} XP, +₦${result.coins_awarded}`);
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete mission");
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = mission.status === 'completed';

  return (
    <div 
      className={`glass rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{mission.title}</h4>
          {mission.description && (
            <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{mission.est_minutes} min</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Zap className="w-3 h-3" />
              <span>+{mission.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-accent">
              <Coins className="w-3 h-3" />
              <span>+₦{mission.coin_reward}</span>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Completing...' : 'Complete'}
          </button>
        )}
        
        {isCompleted && (
          <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-semibold">
            ✓ Done
          </div>
        )}
      </div>
    </div>
  );
};
