import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface BentoCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend: "up" | "down" | "neutral";
  delay?: number;
  gradient?: "orange" | "blue" | "purple" | "pink" | "green" | "cyber";
  size?: "normal" | "large";
}

export const BentoCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  change,
  trend,
  delay = 0,
  gradient,
  size = "normal",
}: BentoCardProps) => {
  const trendColor = trend === "up" ? "text-white" : trend === "down" ? "text-white" : "text-white/90";
  
  const gradientClass = gradient 
    ? `bg-gradient-${gradient}` 
    : "glass";
  
  const sizeClass = size === "large" ? "md:col-span-2" : "";

  return (
    <div
      className={`group ${gradientClass} rounded-3xl p-6 hover:scale-[1.02] transition-all duration-500 cursor-pointer animate-scale-in shadow-depth hover:shadow-depth-xl relative overflow-hidden card-3d ${sizeClass}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-3xl border border-white/20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-3 rounded-2xl ${gradient ? 'bg-white/20 backdrop-blur-sm' : 'bg-primary/10'} float-3d`}>
            <Icon className={`w-7 h-7 ${gradient ? 'text-white' : 'text-primary'}`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 ${trendColor} bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full`}>
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend === "down" ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span className="text-sm font-semibold">{change}</span>
            </div>
          )}
        </div>

        <h3 className={`text-sm font-medium mb-3 ${gradient ? 'text-white/80' : 'text-muted-foreground'}`}>
          {title}
        </h3>
        <p className={`text-4xl font-bold mb-2 ${gradient ? 'text-white' : 'text-foreground'}`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-sm ${gradient ? 'text-white/70' : 'text-muted-foreground'}`}>
            {subtitle}
          </p>
        )}

        {/* Floating particles on hover */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1.5 h-1.5 ${gradient ? 'bg-white' : 'bg-primary'} rounded-full animate-particle blur-sm`}
              style={{
                left: `${Math.random() * 30}px`,
                top: `${Math.random() * 30}px`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
