import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Menu, Home, BarChart3, Trophy, Wallet, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpFAQ } from "@/components/HelpFAQ";

const ACADEMY_URL = "https://blackpal-ascend-protocol.lovable.app/dashboard";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showNav?: boolean;
}

const NAV = [
  { key: "/", label: "Home", Icon: Home },
  { key: "/terminal", label: "Trade", Icon: BarChart3 },
  { key: "/leaderboard", label: "Ranks", Icon: Trophy },
  { key: "/claims", label: "Wallet", Icon: Wallet },
];

export const AppShell = ({ children, title, showHeader = true, showNav = true }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase.from("profiles") as any).select("display_name, avatar_url").eq("user_id", session.user.id).maybeSingle();
      setUser({
        name: data?.display_name || session.user.email?.split("@")[0] || "Trader",
        avatar: data?.avatar_url || null,
      });
    })();
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col text-foreground">
      {showHeader && (
        <header className="px-4 pt-5 pb-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl bg-background/30">
          <button onClick={() => navigate("/settings")} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--purple))] p-[2px]">
                <div className="w-full h-full rounded-full bg-[hsl(var(--background))] flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-[hsl(var(--primary))]">{(user?.name?.[0] || "T").toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--primary))] border-2 border-[hsl(var(--background))] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-left">
              <div className="text-[15px] font-bold leading-tight tracking-tight">{user?.name || "Trader"}</div>
              <div className="text-[11px] text-muted-foreground/70 leading-tight">{title || "Welcome Back"}</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <a
              href={ACADEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-10 px-3 rounded-full glass-pill hover:scale-105 active:scale-95 transition-transform"
              aria-label="Open Academy"
              title="Open Academy in new tab"
            >
              <GraduationCap className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span className="text-[11px] font-bold tracking-wide hidden sm:inline">Academy</span>
            </a>
            <HelpFAQ />
            <button
              onClick={() => navigate("/blacknotify")}
              className="relative w-10 h-10 rounded-full glass-pill flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-foreground/80" />
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[hsl(var(--coral))] text-[9px] font-black text-white flex items-center justify-center">2</span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full glass-pill flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4 text-foreground/80" />
            </button>
          </div>
        </header>
      )}

      <main className={cn("flex-1 px-4", showNav && "pb-28")}>{children}</main>

      {showNav && (
        <nav
          aria-label="Primary"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 rounded-full glass-pill"
          style={{ boxShadow: "0 20px 40px -10px hsl(230 50% 0% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.08)" }}
        >
          {NAV.map(({ key, label, Icon }) => {
            const active = location.pathname === key;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
                  active
                    ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--purple))] text-white shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {active && <span className="text-[11px] font-bold tracking-wide">{label}</span>}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default AppShell;
