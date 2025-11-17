import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WalletBalance {
  token_symbol: string;
  token_name: string;
  balance: number;
}

export const WalletSnapshot = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNGN, setTotalNGN] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadWalletData();

    // Subscribe to realtime wallet updates
    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets'
        },
        () => {
          loadWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_wallets')
        .select(`
          balance,
          tokens:token_id (
            symbol,
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formatted: WalletBalance[] = (data || []).map((item: any) => ({
        token_symbol: item.tokens.symbol,
        token_name: item.tokens.name,
        balance: parseFloat(item.balance)
      }));

      setBalances(formatted);
      
      // Calculate total in NGN
      const ngnBalance = formatted.find(b => b.token_symbol === 'NGN')?.balance || 0;
      setTotalNGN(ngnBalance);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-24 mb-4" />
        <div className="h-8 bg-muted rounded w-32 mb-2" />
        <div className="h-4 bg-muted rounded w-20" />
      </div>
    );
  }

  return (
    <div 
      className="glass rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
      onClick={() => navigate('/blackvault')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Wallet</h3>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold gradient-text-cyber mb-1">
          ₦{totalNGN.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1 text-sm text-accent">
          <TrendingUp className="w-4 h-4" />
          <span>Total Balance</span>
        </div>
      </div>

      {balances.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          {balances.slice(0, 3).map((balance) => (
            <div key={balance.token_symbol} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{balance.token_symbol}</span>
              <span className="font-semibold">
                {balance.balance.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: balance.token_symbol === 'BTC' ? 8 : 2 
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {balances.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Complete missions to earn coins!
        </p>
      )}
    </div>
  );
};
