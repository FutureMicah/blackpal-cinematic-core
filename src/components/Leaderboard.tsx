import { Crown, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  change: number;
}

const mockData: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Chen", xp: 15420, streak: 28, change: 2 },
  { rank: 2, name: "Sarah Williams", xp: 14230, streak: 21, change: -1 },
  { rank: 3, name: "Marcus Rodriguez", xp: 13890, streak: 14, change: 1 },
  { rank: 4, name: "Emma Thompson", xp: 12650, streak: 19, change: 3 },
  { rank: 5, name: "You", xp: 11250, streak: 7, change: 5 },
];

export const Leaderboard = () => {
  return (
    <div className="glass rounded-2xl p-6 overflow-hidden">
      <div className="space-y-3">
        {mockData.map((entry, index) => {
          const isTop3 = entry.rank <= 3;
          const isUser = entry.name === "You";
          const rankColor = entry.rank === 1 ? "text-gold" : entry.rank === 2 ? "text-muted-foreground" : entry.rank === 3 ? "text-amber-700" : "text-foreground";

          return (
            <div
              key={entry.rank}
              className={`group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-102 ${
                isUser ? "bg-primary/10 glow-cyan" : "bg-muted/30"
              } ${isTop3 ? "hover:shadow-xl" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rank with glow for top 3 */}
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-full font-bold ${isTop3 ? "glow-gold" : ""} ${
                entry.rank === 1 ? "bg-gold/20" : entry.rank === 2 ? "bg-muted" : entry.rank === 3 ? "bg-amber-700/20" : "bg-muted/50"
              }`}>
                {entry.rank === 1 && (
                  <Crown className="absolute -top-3 w-6 h-6 text-gold animate-pulse" />
                )}
                <span className={`text-lg ${rankColor}`}>#{entry.rank}</span>
              </div>

              {/* User info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${isUser ? "gradient-text-cyber" : ""}`}>
                    {entry.name}
                  </h3>
                  {isUser && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{entry.xp.toLocaleString()} XP</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-gold">🔥</span>
                    {entry.streak} day streak
                  </span>
                </div>
              </div>

              {/* Rank change indicator */}
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                entry.change > 0 ? "bg-accent/20 text-accent" : entry.change < 0 ? "bg-destructive/20 text-destructive" : "bg-muted/50 text-muted-foreground"
              }`}>
                <TrendingUp className={`w-4 h-4 ${entry.change < 0 ? "rotate-180" : ""}`} />
                <span className="text-sm font-semibold">{Math.abs(entry.change)}</span>
              </div>

              {/* Hover particles for top 3 */}
              {isTop3 && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-gold rounded-full animate-particle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random()}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
