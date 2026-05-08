import { format } from "date-fns";

export interface ReceiptData {
  tier: string;
  rank: number;
  amount: number;
  period: string;
  claimed_at: string;
  pnl?: number;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const openReceiptPrint = (r: ReceiptData) => {
  const tierLabel = escapeHtml(r.tier.replace("_", " "));
  const claimed = format(new Date(r.claimed_at), "MMMM d, yyyy · HH:mm 'UTC'");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Prize Receipt · ${escapeHtml(r.period)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;background:#0a0a12;color:#e8e8f0;margin:0;padding:48px 24px;display:flex;justify-content:center}
  .card{width:100%;max-width:520px;background:linear-gradient(160deg,#13131e 0%,#0a0a12 100%);border:1px solid rgba(212,175,55,.3);border-radius:24px;padding:40px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
  .badge{font-size:10px;letter-spacing:.3em;color:#8a8a9a;font-weight:700;text-transform:uppercase}
  .title{font-size:14px;letter-spacing:.25em;color:#d4af37;font-weight:800;margin:6px 0 28px}
  .amount{font-size:48px;font-weight:900;background:linear-gradient(90deg,#d4af37,#ff8c42);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
  .tier{font-size:13px;font-weight:700;margin-top:6px;color:#fff}
  .tier small{color:#8a8a9a;font-weight:500;margin-left:8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:32px}
  .row{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px 16px}
  .row .k{font-size:9px;letter-spacing:.2em;color:#7a7a8a;font-weight:600;text-transform:uppercase}
  .row .v{font-family:'SF Mono',Menlo,monospace;font-weight:700;font-size:14px;margin-top:4px;color:#fff;word-break:break-word}
  .footer{margin-top:28px;padding-top:20px;border-top:1px dashed rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#5a5a6a;letter-spacing:.1em}
  .stamp{border:2px solid #d4af37;color:#d4af37;padding:6px 14px;border-radius:8px;font-weight:800;letter-spacing:.2em;font-size:10px;transform:rotate(-4deg)}
  @media print{body{background:#fff;color:#111;padding:0}.card{border-color:#d4af37;box-shadow:none;background:#fff}.row{background:#fafafa;border-color:#eee}.row .k{color:#666}.row .v{color:#111}.footer{color:#666;border-color:#ddd}.tier{color:#111}.tier small{color:#666}}
</style></head>
<body>
  <div class="card">
    <div class="badge">BlackPal · Contest Receipt</div>
    <div class="title">PRIZE CLAIMED</div>
    <div class="amount">+${r.amount.toLocaleString()} BTK</div>
    <div class="tier">${tierLabel}<small>· Rank #${r.rank}</small></div>
    <div class="grid">
      <div class="row"><div class="k">Contest Period</div><div class="v">${escapeHtml(r.period)}</div></div>
      <div class="row"><div class="k">Claimed</div><div class="v">${escapeHtml(claimed)}</div></div>
      <div class="row"><div class="k">Tier</div><div class="v">${tierLabel}</div></div>
      <div class="row"><div class="k">Rank</div><div class="v">#${r.rank}</div></div>
      ${r.pnl !== undefined ? `<div class="row" style="grid-column:1/-1"><div class="k">Period P&L</div><div class="v">${r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)}</div></div>` : ""}
    </div>
    <div class="footer">
      <span>blackpal.app · ${format(new Date(), "yyyy-MM-dd")}</span>
      <span class="stamp">SETTLED</span>
    </div>
  </div>
  <script>setTimeout(()=>{window.print()},250);</script>
</body></html>`;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) {
    // popup blocked — fallback to data URL download
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${r.period}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
};
