import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  Vault, 
  Users, 
  User, 
  Zap, 
  Coins, 
  Settings, 
  Bell,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "BlackBoard", path: "/blackboard", color: "text-blue-400" },
  { icon: Vault, label: "BlackVault", path: "/blackvault", color: "text-gold" },
  { icon: Users, label: "BlackVerse", path: "/blackverse", color: "text-purple" },
  { icon: User, label: "BlackPass", path: "/blackpass", color: "text-primary" },
  { icon: Zap, label: "BlackForge", path: "/blackforge", color: "text-accent" },
  { icon: Coins, label: "BlackCoin", path: "/blackcoin", color: "text-secondary" },
  { icon: Settings, label: "BlackDesk", path: "/settings" },
  { icon: Bell, label: "BlackNotify", path: "/blacknotify", color: "text-orange-400" },
];

export const FloatingNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Floating Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full glass-strong flex items-center justify-center glow-cyan hover:scale-110 transition-all duration-300 group"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-primary" />
        ) : (
          <Menu className="w-6 h-6 text-primary" />
        )}
        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
      </button>

      {/* Navigation Panel */}
      <div
        className={cn(
          "fixed left-6 top-24 z-40 w-64 glass-strong rounded-3xl p-6 shadow-depth-xl border border-primary/20 transition-all duration-500 overflow-hidden",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
        )}
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            Navigation Hub
          </h3>
          
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-primary/20 text-primary shadow-lg scale-105" 
                      : "hover:bg-primary/10 text-foreground/80 hover:text-foreground"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Hover glow effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive ? "opacity-50" : ""
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
                  </div>
                  
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/30" : "bg-background/50 group-hover:bg-primary/20"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      item.color || "text-primary"
                    )} />
                  </div>
                  
                  <span className="relative font-medium text-sm">
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  
                  {/* Floating particles on hover */}
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[...Array(3)].map((_, i) => (
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
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
