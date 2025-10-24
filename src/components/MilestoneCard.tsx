import { Lock, Trophy, Zap, Coins } from "lucide-react";

interface MilestoneCardProps {
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  unlocked: boolean;
  progress?: number;
  total?: number;
  delay?: number;
}

export const MilestoneCard = ({
  title,
  description,
  xpReward,
  coinReward,
  unlocked,
  progress,
  total,
  delay = 0,
}: MilestoneCardProps) => {
  const progressPercentage = progress && total ? (progress / total) * 100 : 0;

  return (
    <div
      className={`group glass rounded-2xl p-6 transition-all duration-500 hover:scale-105 cursor-pointer animate-scale-in relative overflow-hidden ${
        unlocked ? "hover:shadow-2xl glow-gold" : ""
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Celebration particles for unlocked */}
      {unlocked && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gold rounded-full animate-particle opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${unlocked ? "bg-gold/20 glow-gold" : "bg-muted"}`}>
            {unlocked ? (
              <Trophy className="w-6 h-6 text-gold animate-pulse" />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          {unlocked && (
            <div className="px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">
              UNLOCKED
            </div>
          )}
        </div>

        <h3 className={`text-xl font-bold mb-2 ${unlocked ? "gradient-text-wealth" : "text-foreground"}`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {/* Progress bar for locked milestones */}
        {!unlocked && progress !== undefined && total !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}/{total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Zap className={`w-4 h-4 ${unlocked ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
              {xpReward} XP
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className={`w-4 h-4 ${unlocked ? "text-accent" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${unlocked ? "text-accent" : "text-muted-foreground"}`}>
              {coinReward} Coins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
