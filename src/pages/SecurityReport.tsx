import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck, ShieldAlert } from "lucide-react";

const REPORT = {
  generated_at: new Date().toISOString(),
  project: "BlackPal",
  summary: {
    fixed: [
      { id: "SUPA_authenticated_security_definer_function_executable", note: "has_role → SECURITY INVOKER; claim_contest_prize, complete_mission, get_contest_leaderboard EXECUTE revoked from authenticated and moved behind JWT-verifying edge functions." },
      { id: "quizzes_correct_answer_public", note: "Column-level grants: correct_answer no longer selectable by anon/authenticated." },
      { id: "realtime_messages_no_topic_scoping", note: "realtime.messages SELECT policy scoped to realtime.topic() = auth.uid()::text." },
      { id: "auth_leaked_password_protection", note: "HIBP check enabled on email password auth." },
      { id: "function_search_path_mutable", note: "SET search_path = public on all trigger/utility functions." },
    ],
    still_review: [
      { id: "manual_pen_test", note: "Automated scanners don't perform business-logic pen-testing; manual review of contest_claims replay & wallet arithmetic recommended." },
      { id: "storage_bucket_policies", note: "payment-screenshots bucket is private; verify object-level RLS matches admin/verifier expectations after each schema change." },
      { id: "rate_limits", note: "No edge function rate limiting yet — consider a per-IP throttle on claim-prize and complete-mission." },
    ],
  },
} as const;

export default function SecurityReport() {
  const download = () => {
    const blob = new Blob([JSON.stringify(REPORT, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-scan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Report</h1>
            <p className="text-sm text-muted-foreground">Latest scan summary and one-click export.</p>
          </div>
          <Button onClick={download} className="gap-2">
            <Download className="w-4 h-4" /> Export JSON
          </Button>
        </div>

        <section className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[hsl(var(--accent))]" /> Fixed
          </div>
          <ul className="space-y-2 text-sm">
            {REPORT.summary.fixed.map((f) => (
              <li key={f.id} className="flex gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{f.id}</div>
                  <div>{f.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-[hsl(var(--gold))]" /> Still to review
          </div>
          <ul className="space-y-2 text-sm">
            {REPORT.summary.still_review.map((f) => (
              <li key={f.id} className="flex gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))] shrink-0" />
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{f.id}</div>
                  <div>{f.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
