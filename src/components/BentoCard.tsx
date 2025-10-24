import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface BentoCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend: "up" | "down" | "neutral";
  delay?: number;
}

export const BentoCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  change,
  trend,
  delay = 0,
}: BentoCardProps) => {
  const trendColor = trend === "up" ? "text-accent" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div
      className="group glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in hover:shadow-2xl relative overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`absolute inset-0 ${trend === 'up' ? 'glow-green' : trend === 'down' ? 'glow-pink' : 'glow-cyan'} blur-xl`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-primary/10 ${trend === 'up' ? 'glow-cyan' : ''}`}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend === "down" ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>

        <h3 className="text-sm text-muted-foreground mb-2">{title}</h3>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}

        {/* Mini sparkle animation */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-particle"
              style={{
                left: `${Math.random() * 20}px`,
                top: `${Math.random() * 20}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
