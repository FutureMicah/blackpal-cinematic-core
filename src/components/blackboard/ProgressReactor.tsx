import { useEffect, useState } from "react";

interface ProgressReactorProps {
  xp: number;
  xpToNext: number;
  level: number;
}

export const ProgressReactor = ({ xp, xpToNext, level }: ProgressReactorProps) => {
  const [rotation, setRotation] = useState(0);
  const progress = Math.min(100, (xp / xpToNext) * 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer rotating ring */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ transform: `rotate(${rotation}deg)` }}
        viewBox="0 0 200 200"
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="4 8"
        />
      </svg>

      {/* Middle ring with progress */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          opacity="0.2"
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeDasharray={`${progress * 5.027} 502.7`}
          className="transition-all duration-800"
          style={{ 
            filter: 'drop-shadow(0 0 12px hsl(var(--primary)))',
          }}
        />
      </svg>

      {/* Inner ring */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ transform: `rotate(${-rotation * 0.5}deg)` }}
        viewBox="0 0 200 200"
      >
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="2 6"
        />
      </svg>

      {/* Center core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative glass rounded-full w-24 h-24 flex flex-col items-center justify-center border border-primary/30">
            <div className="text-3xl font-bold gradient-text-cyber">
              {level}
            </div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
        </div>
      </div>

      {/* XP label below */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
        <div className="text-sm font-semibold">
          <span className="text-primary">{xp.toLocaleString()}</span>
          <span className="text-muted-foreground"> / {xpToNext.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full animate-float"
          style={{
            left: `${50 + 40 * Math.cos((i * 60 * Math.PI) / 180)}%`,
            top: `${50 + 40 * Math.sin((i * 60 * Math.PI) / 180)}%`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
};
