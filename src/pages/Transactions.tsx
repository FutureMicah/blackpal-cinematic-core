import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  screenshot_url: string | null;
  payment_reference: string | null;
  created_at: string;
  completed_at: string | null;
}

type StatusFilter = "all" | "completed" | "pending" | "processing" | "failed" | "cancelled";
type TypeFilter = "all" | "deposit" | "withdrawal" | "registration_fee";

export default function Transactions() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTransactions();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.transaction_type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${t.transaction_type} ${t.payment_method} ${t.payment_reference ?? ""} ${t.currency} ${t.amount}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, typeFilter, search]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      processing: "secondary",
      failed: "destructive",
      cancelled: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="text-[10px]">
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTransactionIcon = (type: string) => {
    if (type === "deposit" || type === "registration_fee") {
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  };

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Search</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Reference, method, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Status</label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Type</label>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="registration_fee">Registration fee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="shrink-0">
            <ChevronLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold truncate">Transactions</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {filtered.length} of {transactions.length} shown
            </p>
          </div>

          {/* Mobile filter trigger */}
          {isMobile && (
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 relative">
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter transactions</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <FilterControls />
                </div>
                <SheetFooter>
                  <Button className="w-full" onClick={() => setFilterOpen(false)}>
                    Show {filtered.length} results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Desktop inline filters */}
        {!isMobile && (
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reference, method, amount..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="registration_fee">Registration fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
            </p>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filtered.map((t) => (
              <Card key={t.id} className="p-3 sm:p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 rounded-full bg-muted shrink-0">
                    {getTransactionIcon(t.transaction_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-semibold capitalize text-sm sm:text-base truncate">
                            {t.transaction_type.replace("_", " ")}
                          </h3>
                          {getStatusBadge(t.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {t.payment_method.toUpperCase()}
                          {t.payment_reference && (
                            <> • {t.payment_reference.slice(0, 10)}…</>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-xl font-bold whitespace-nowrap">
                          {t.currency} {t.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {getStatusIcon(t.status)}
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()}
                      </p>
                      {t.screenshot_url && (
                        <a
                          href={t.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs text-primary hover:underline shrink-0"
                        >
                          View proof
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
