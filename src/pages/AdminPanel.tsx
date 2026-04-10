import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Pause, Power, Loader2, Search, RefreshCw,
  Ban, Eye, ArrowLeft
} from "lucide-react";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  account_tier: string | null;
  total_xp: number | null;
  current_streak: number | null;
  payment_verified: boolean | null;
  created_at: string | null;
  country_name: string | null;
  is_premium: boolean | null;
}

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [systemMode, setSystemMode] = useState("live");
  const [globalTrading, setGlobalTrading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Admin settings state
  const [btkPrice, setBtkPrice] = useState("0.01");
  const [tradingFee, setTradingFee] = useState("0.2");
  const [spreadMultiplier, setSpreadMultiplier] = useState("1.1");
  const [maxRisk, setMaxRisk] = useState("5");
  const [blockNoSl, setBlockNoSl] = useState(true);
  const [choppyFilter, setChoppyFilter] = useState(true);

  // Bot settings
  const [botTimeframe, setBotTimeframe] = useState("1H");
  const [fibEntry, setFibEntry] = useState("38.2");
  const [tpMultiplier, setTpMultiplier] = useState("2");
  const [maxTradesDay, setMaxTradesDay] = useState("5");
  const [botsActive, setBotsActive] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({ title: "Access Denied", description: "Admin privileges required.", variant: "destructive" });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadUsers();
      loadSettings();
    } catch (err) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, account_tier, total_xp, current_streak, payment_verified, created_at, country_name, is_premium")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_ui_settings")
      .select("key, value, category");
    if (data) {
      data.forEach((s) => {
        const val = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
        switch (s.key) {
          case "btk_price": setBtkPrice(val); break;
          case "trading_fee": setTradingFee(val); break;
          case "spread_multiplier": setSpreadMultiplier(val); break;
          case "max_risk": setMaxRisk(val); break;
          case "block_no_sl": setBlockNoSl(val === "true"); break;
          case "system_mode": setSystemMode(val); break;
          case "global_trading": setGlobalTrading(val === "true"); break;
        }
      });
    }
  };

  const saveSetting = async (key: string, value: string, category: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("admin_ui_settings")
      .upsert({ key, value: value as any, category, updated_by: session?.user.id }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${key} updated.` });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.full_name?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Icon3D name="shield" size={28} />
            <h1 className="text-lg font-bold">Admin Control Center</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Kill Switch */}
            <Button
              variant={globalTrading ? "outline" : "destructive"}
              size="sm"
              onClick={() => {
                setGlobalTrading(!globalTrading);
                saveSetting("global_trading", (!globalTrading).toString(), "system");
              }}
            >
              {globalTrading ? <Power className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
              {globalTrading ? "Trading ON" : "TRADING HALTED"}
            </Button>
            {/* System Mode */}
            <Select value={systemMode} onValueChange={(v) => { setSystemMode(v); saveSetting("system_mode", v, "system"); }}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">🟢 LIVE</SelectItem>
                <SelectItem value="safe">🟡 SAFE MODE</SelectItem>
                <SelectItem value="simulation">🔵 SIMULATION</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto bg-card/50 p-1">
            {[
              { value: "users", icon: "users" as Icon3DName, label: "Users" },
              { value: "economy", icon: "wallet" as Icon3DName, label: "BTK Economy" },
              { value: "market", icon: "chart" as Icon3DName, label: "Market" },
              { value: "bot", icon: "bot" as Icon3DName, label: "Bot Control" },
              { value: "decision", icon: "brain" as Icon3DName, label: "Decision" },
              { value: "feedback", icon: "intel" as Icon3DName, label: "Feedback" },
              { value: "analytics", icon: "trade" as Icon3DName, label: "Analytics" },
              { value: "roles", icon: "shield" as Icon3DName, label: "Roles" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center gap-1 text-xs py-2 px-1">
                <Icon3D name={tab.icon} size={20} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 1. USER CONTROL */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" size="icon" onClick={loadUsers}><RefreshCw className="w-4 h-4" /></Button>
            </div>

            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 50).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{u.account_tier || "free"}</Badge></TableCell>
                        <TableCell className="text-sm">{u.total_xp || 0}</TableCell>
                        <TableCell className="text-sm">{u.current_streak || 0}🔥</TableCell>
                        <TableCell className="text-sm">{u.country_name || "—"}</TableCell>
                        <TableCell>
                          {u.payment_verified ? (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Verified</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Ban className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 border-t border-border/50 text-sm text-muted-foreground">
                Showing {Math.min(filteredUsers.length, 50)} of {filteredUsers.length} users
              </div>
            </Card>
          </TabsContent>

          {/* 2. BTK ECONOMY */}
          <TabsContent value="economy" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 bg-card/50 backdrop-blur-sm space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Icon3D name="wallet" size={18} /> Currency Controls</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">BTK Value (USD)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={btkPrice} onChange={(e) => setBtkPrice(e.target.value)} className="h-9" />
                      <Button size="sm" onClick={() => saveSetting("btk_price", btkPrice, "economy")}>Save</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Trading Fee (%)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={tradingFee} onChange={(e) => setTradingFee(e.target.value)} className="h-9" />
                      <Button size="sm" onClick={() => saveSetting("trading_fee", tradingFee, "economy")}>Save</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Spread Multiplier</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={spreadMultiplier} onChange={(e) => setSpreadMultiplier(e.target.value)} className="h-9" />
                      <Button size="sm" onClick={() => saveSetting("spread_multiplier", spreadMultiplier, "economy")}>Save</Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Icon3D name="trade" size={18} /> Economy Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Users", value: users.length },
                    { label: "Verified", value: users.filter(u => u.payment_verified).length },
                    { label: "Premium", value: users.filter(u => u.is_premium).length },
                    { label: "Avg XP", value: Math.round(users.reduce((a, u) => a + (u.total_xp || 0), 0) / (users.length || 1)) },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-background/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 3. MARKET CONTROL */}
          <TabsContent value="market" className="mt-4 space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon3D name="chart" size={18} /> Asset Management</h3>
              <p className="text-sm text-muted-foreground mb-4">Control which trading pairs are available on the platform.</p>
              <div className="space-y-3">
                {[
                  { pair: "BTC/USDT", type: "Crypto", active: true },
                  { pair: "ETH/USDT", type: "Crypto", active: true },
                  { pair: "EUR/USD", type: "Forex", active: true },
                  { pair: "GBP/JPY", type: "Forex", active: true },
                  { pair: "GOLD", type: "Commodity", active: true },
                  { pair: "OIL", type: "Commodity", active: false },
                ].map((asset) => (
                  <div key={asset.pair} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{asset.type}</Badge>
                      <span className="font-medium text-sm">{asset.pair}</span>
                    </div>
                    <Switch defaultChecked={asset.active} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* 4. BOT CONTROL */}
          <TabsContent value="bot" className="mt-4 space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Icon3D name="bot" size={18} /> Auto Sniper Settings</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Bots Active</span>
                  <Switch checked={botsActive} onCheckedChange={setBotsActive} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Trend Timeframe</Label>
                  <Select value={botTimeframe} onValueChange={setBotTimeframe}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15M">15 Minutes</SelectItem>
                      <SelectItem value="1H">1 Hour</SelectItem>
                      <SelectItem value="4H">4 Hours</SelectItem>
                      <SelectItem value="1D">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fibonacci Entry (%)</Label>
                  <Input value={fibEntry} onChange={(e) => setFibEntry(e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">TP Multiplier</Label>
                  <Input value={tpMultiplier} onChange={(e) => setTpMultiplier(e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Max Trades/Day</Label>
                  <Input value={maxTradesDay} onChange={(e) => setMaxTradesDay(e.target.value)} className="h-9 mt-1" />
                </div>
              </div>

              <Button onClick={() => {
                saveSetting("bot_timeframe", botTimeframe, "bot");
                saveSetting("fib_entry", fibEntry, "bot");
                saveSetting("tp_multiplier", tpMultiplier, "bot");
                saveSetting("max_trades_day", maxTradesDay, "bot");
              }} className="w-full">
                Save Bot Configuration
              </Button>

              <Button variant="destructive" className="w-full" onClick={() => { setBotsActive(false); toast({ title: "All Bots Paused" }); }}>
                <Pause className="w-4 h-4 mr-2" /> Emergency: Pause ALL Bots
              </Button>
            </Card>
          </TabsContent>

          {/* 5. DECISION ENGINE */}
          <TabsContent value="decision" className="mt-4 space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur-sm space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Icon3D name="brain" size={18} /> Risk & Validation Rules</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Max Risk Allowed (%)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} className="h-9" />
                    <Button size="sm" onClick={() => saveSetting("max_risk", maxRisk, "decision")}>Save</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">Block Trade if No SL</p>
                    <p className="text-xs text-muted-foreground">Prevent trades without stop loss</p>
                  </div>
                  <Switch checked={blockNoSl} onCheckedChange={(v) => { setBlockNoSl(v); saveSetting("block_no_sl", v.toString(), "decision"); }} />
                </div>
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">Choppy Market Filter</p>
                    <p className="text-xs text-muted-foreground">Block trades in ranging markets</p>
                  </div>
                  <Switch checked={choppyFilter} onCheckedChange={(v) => { setChoppyFilter(v); saveSetting("choppy_filter", v.toString(), "decision"); }} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 6. SMART FEEDBACK */}
          <TabsContent value="feedback" className="mt-4 space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur-sm space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Icon3D name="intel" size={18} /> Feedback Messages</h3>
              <div className="space-y-3">
                {[
                  { trigger: "3 consecutive losses", message: "You're overtrading. Take a break.", severity: "warning" },
                  { trigger: "Risk > 5%", message: "Reduce your position size.", severity: "danger" },
                  { trigger: "No SL set", message: "Always protect your capital with a stop loss.", severity: "info" },
                  { trigger: "5+ trades/hour", message: "Slow down. Quality over quantity.", severity: "warning" },
                ].map((rule, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={rule.severity === "danger" ? "destructive" : "outline"} className="text-xs">
                        {rule.trigger}
                      </Badge>
                      <Switch defaultChecked />
                    </div>
                    <Input defaultValue={rule.message} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* 7. ANALYTICS */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Users", value: users.length, icon: "users" as Icon3DName },
                { label: "Active Today", value: users.filter(u => u.current_streak && u.current_streak > 0).length, icon: "intel" as Icon3DName },
                { label: "Premium Users", value: users.filter(u => u.is_premium).length, icon: "trade" as Icon3DName },
                { label: "Avg Streak", value: Math.round(users.reduce((a, u) => a + (u.current_streak || 0), 0) / (users.length || 1)), icon: "chart" as Icon3DName },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 bg-card/50 backdrop-blur-sm text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </Card>
              ))}
            </div>

            <Card className="p-5 bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold mb-3">Top Traders by XP</h3>
              <div className="space-y-2">
                {users.sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 10).map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between bg-background/50 rounded-lg p-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                      <span className="text-sm">{u.full_name || u.email}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{u.total_xp || 0} XP</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* 8. ROLES & PERMISSIONS */}
          <TabsContent value="roles" className="mt-4 space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Role Hierarchy</h3>
              <div className="space-y-3">
                {[
                  { role: "👑 Super Admin", desc: "Full control over platform", color: "text-yellow-400" },
                  { role: "🧑‍💼 Admin", desc: "Manage users, view analytics", color: "text-blue-400" },
                  { role: "🛠 Moderator", desc: "Monitor activity, handle reports", color: "text-green-400" },
                  { role: "👤 User", desc: "Trade only", color: "text-muted-foreground" },
                ].map((r) => (
                  <div key={r.role} className="bg-background/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className={`font-medium text-sm ${r.color}`}>{r.role}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{
                      r.role.includes("Super") ? 1 :
                      r.role.includes("Admin") ? users.length > 0 ? "—" : 0 :
                      r.role.includes("Mod") ? "—" :
                      users.length
                    }</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
