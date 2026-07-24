import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Trophy, Target, Coins, Clock } from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  kind: "prize_claim" | "mission" | "trade";
  actor: string | null;
  title: string;
  detail: string;
  amount: number | null;
  request_id: string;
  at: string;
};

export default function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"me" | "all">("me");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { setLoading(false); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const admin = (roles || []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);

      const usingAll = admin && scope === "all";

      const claimsQ = supabase
        .from("contest_claims")
        .select("id, user_id, contest_period, rank, prize_tier, prize_amount, claimed_at")
        .order("claimed_at", { ascending: false })
        .limit(100);
      const activitiesQ = supabase
        .from("user_activities")
        .select("id, user_id, activity_type, title, description, metadata, created_at")
        .in("activity_type", ["mission_completed", "trade_executed", "trade_closed"])
        .order("created_at", { ascending: false })
        .limit(100);

      const [{ data: claims }, { data: acts }] = await Promise.all([
        usingAll ? claimsQ : claimsQ.eq("user_id", uid),
        usingAll ? activitiesQ : activitiesQ.eq("user_id", uid),
      ]);

      const items: Row[] = [];
      (claims || []).forEach((c: any) => items.push({
        id: `claim-${c.id}`,
        kind: "prize_claim",
        actor: c.user_id,
        title: `Prize claimed · ${c.prize_tier?.replace("_", " ")}`,
        detail: `Rank #${c.rank} · ${c.contest_period}`,
        amount: Number(c.prize_amount ?? 0),
        request_id: c.id,
        at: c.claimed_at,
      }));
      (acts || []).forEach((a: any) => items.push({
        id: `act-${a.id}`,
        kind: a.activity_type === "mission_completed" ? "mission" : "trade",
        actor: a.user_id,
        title: a.title || a.activity_type,
        detail: a.description || "",
        amount: a.metadata?.pnl != null ? Number(a.metadata.pnl) : (a.metadata?.coins ?? null),
        request_id: a.id,
        at: a.created_at,
      }));
      items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      setRows(items.slice(0, 200));
      setLoading(false);
    })();
  }, [scope]);

  const iconFor = (k: Row["kind"]) =>
    k === "prize_claim" ? <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" /> :
    k === "mission" ? <Target className="w-4 h-4 text-[hsl(var(--primary))]" /> :
    <Coins className="w-4 h-4 text-[hsl(var(--accent))]" />;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">Prize claims, mission completions, and trade events.</p>
          </div>
          {isAdmin && (
            <div className="flex rounded-lg border border-border/40 overflow-hidden text-xs">
              {(["me", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-3 py-1.5 ${scope === s ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  {s === "me" ? "Me" : "All users"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl divide-y divide-border/10">
          {loading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!loading && rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No activity yet.</div>}
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3">
              <div className="mt-0.5">{iconFor(r.kind)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {format(new Date(r.at), "MMM d, HH:mm:ss")}
                  </div>
                </div>
                {r.detail && <div className="text-xs text-muted-foreground truncate">{r.detail}</div>}
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground/70">
                  <span>req: {r.request_id.slice(0, 8)}</span>
                  {r.actor && scope === "all" && <span>user: {r.actor.slice(0, 8)}</span>}
                  {r.amount != null && <span className={r.amount >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]"}>
                    {r.amount >= 0 ? "+" : ""}{r.amount.toFixed(2)}
                  </span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
