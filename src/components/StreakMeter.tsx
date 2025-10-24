import { Flame, Zap } from "lucide-react";

interface StreakMeterProps {
  currentStreak: number;
  totalDays: number;
  xp: number;
}

export const StreakMeter = ({ currentStreak, totalDays, xp }: StreakMeterProps) => {
  const percentage = (currentStreak / totalDays) * 100;

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden hover:shadow-2xl transition-all duration-500 group">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold rounded-full animate-particle opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gold/20 glow-gold">
              <Flame className="w-8 h-8 text-gold animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text-wealth">Streak Power</h2>
              <p className="text-sm text-muted-foreground">Consistency builds capital</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold gradient-text-cyber">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">day streak</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold via-primary to-accent rounded-full transition-all duration-1000 ease-out glow-gold"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 animate-pulse opacity-50" />
          </div>
          
          {/* Milestone markers */}
          {[7, 14, 21, 28].map((day) => (
            <div
              key={day}
              className="absolute top-0 bottom-0 w-px bg-background/50"
              style={{ left: `${(day / totalDays) * 100}%` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {totalDays - currentStreak} days to max bonus
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-accent">{xp} XP</span>
            <span className="text-muted-foreground">earned</span>
          </div>
        </div>

        {/* Next milestone preview */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next milestone: 14 days</span>
            <span className="font-semibold gradient-text-wealth">+1000 XP, +500 Coins</span>
          </div>
        </div>
      </div>
    </div>
  );
};
