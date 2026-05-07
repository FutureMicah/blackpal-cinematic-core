import { useState, useMemo } from "react";
import { Search, Star, TrendingUp, Flame, Droplets, BarChart3, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Asset {
  symbol: string;
  name: string;
  price: string;
  change: number;
  icon: string;
  category: string;
  volume?: string;
}

const ASSETS: Asset[] = [
  // Crypto
  { symbol: "BTC/USDT", name: "Bitcoin", price: "67,432.50", change: 2.34, icon: "🟡", category: "crypto", volume: "2.1B" },
  { symbol: "ETH/USDT", name: "Ethereum", price: "3,521.80", change: -0.87, icon: "🔵", category: "crypto", volume: "980M" },
  { symbol: "SOL/USDT", name: "Solana", price: "178.45", change: 5.12, icon: "🟣", category: "crypto", volume: "540M" },
  { symbol: "BNB/USDT", name: "BNB", price: "612.30", change: 1.04, icon: "🟨", category: "crypto", volume: "410M" },
  { symbol: "XRP/USDT", name: "Ripple", price: "0.6234", change: 0.45, icon: "⚪", category: "crypto", volume: "180M" },
  { symbol: "ADA/USDT", name: "Cardano", price: "0.4321", change: -0.62, icon: "🔷", category: "crypto", volume: "150M" },
  { symbol: "AVAX/USDT", name: "Avalanche", price: "34.20", change: 3.21, icon: "🔺", category: "crypto", volume: "120M" },
  { symbol: "LINK/USDT", name: "Chainlink", price: "14.85", change: 1.87, icon: "🔗", category: "crypto", volume: "110M" },
  { symbol: "DOT/USDT", name: "Polkadot", price: "6.42", change: -1.04, icon: "⚫", category: "crypto", volume: "95M" },
  { symbol: "MATIC/USDT", name: "Polygon", price: "0.5423", change: 2.10, icon: "🟪", category: "crypto", volume: "90M" },
  { symbol: "DOGE/USDT", name: "Dogecoin", price: "0.1542", change: -1.2, icon: "🐶", category: "crypto", volume: "210M" },
  { symbol: "PEPE/USDT", name: "Pepe", price: "0.00001234", change: 12.5, icon: "🐸", category: "crypto", volume: "320M" },
  { symbol: "SHIB/USDT", name: "Shiba Inu", price: "0.0000234", change: 4.2, icon: "🐕", category: "crypto", volume: "180M" },
  { symbol: "TON/USDT", name: "Toncoin", price: "5.42", change: 2.8, icon: "💎", category: "crypto", volume: "85M" },
  // Forex majors
  { symbol: "EUR/USD", name: "Euro/Dollar", price: "1.0876", change: 0.12, icon: "🇪🇺", category: "forex" },
  { symbol: "GBP/USD", name: "Pound/Dollar", price: "1.2654", change: -0.21, icon: "🇬🇧", category: "forex" },
  { symbol: "USD/JPY", name: "Dollar/Yen", price: "154.230", change: 0.67, icon: "🇺🇸", category: "forex" },
  { symbol: "AUD/USD", name: "Aussie/Dollar", price: "0.6612", change: -0.18, icon: "🇦🇺", category: "forex" },
  { symbol: "USD/CAD", name: "Dollar/Loonie", price: "1.3654", change: 0.24, icon: "🇨🇦", category: "forex" },
  { symbol: "USD/CHF", name: "Dollar/Franc", price: "0.8821", change: -0.09, icon: "🇨🇭", category: "forex" },
  { symbol: "NZD/USD", name: "Kiwi/Dollar", price: "0.6042", change: 0.31, icon: "🇳🇿", category: "forex" },
  // Forex crosses
  { symbol: "GBP/JPY", name: "Pound/Yen", price: "198.432", change: -0.34, icon: "🇬🇧", category: "forex" },
  { symbol: "EUR/JPY", name: "Euro/Yen", price: "167.812", change: 0.42, icon: "🇪🇺", category: "forex" },
  { symbol: "EUR/GBP", name: "Euro/Pound", price: "0.8593", change: 0.15, icon: "🇪🇺", category: "forex" },
  // Commodities
  { symbol: "XAU/USD", name: "Gold", price: "2,412.50", change: 0.89, icon: "🟡", category: "energy" },
  { symbol: "XAG/USD", name: "Silver", price: "31.42", change: 1.24, icon: "⚪", category: "energy" },
  { symbol: "WTI/USD", name: "Crude Oil", price: "78.34", change: -1.56, icon: "🛢️", category: "energy" },
  // Indices
  { symbol: "US30", name: "Dow Jones", price: "39,872", change: 0.45, icon: "📊", category: "indices" },
  { symbol: "NAS100", name: "Nasdaq", price: "17,654", change: 1.23, icon: "📈", category: "indices" },
  { symbol: "SPX500", name: "S&P 500", price: "5,432", change: 0.67, icon: "📉", category: "indices" },
  { symbol: "GER40", name: "DAX", price: "18,210", change: 0.34, icon: "🇩🇪", category: "indices" },
];

const CATEGORIES = [
  { key: "all", label: "All", icon: BarChart3 },
  { key: "crypto", label: "🔥 Crypto", icon: Flame },
  { key: "forex", label: "💱 Forex", icon: TrendingUp },
  { key: "energy", label: "⚡ Commodities", icon: Droplets },
  { key: "indices", label: "📊 Indices", icon: BarChart3 },
];

interface AssetMatrixProps {
  selectedAsset: string;
  onSelectAsset: (symbol: string) => void;
}

export const AssetMatrix = ({ selectedAsset, onSelectAsset }: AssetMatrixProps) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BTC/USDT", "ETH/USDT"]));
  const [sortBy, setSortBy] = useState<"name" | "change">("name");

  const filtered = useMemo(() => {
    let list = ASSETS.filter(a => {
      const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || a.category === category;
      return matchSearch && matchCat;
    });
    if (sortBy === "change") list = [...list].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return list;
  }, [search, category, sortBy]);

  const toggleFav = (symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/70 backdrop-blur-xl border-r border-border/20">
      {/* Header */}
      <div className="p-2.5 border-b border-border/15">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">ASSET MATRIX</h2>
          <button
            onClick={() => setSortBy(s => s === "name" ? "change" : "name")}
            className="p-1 rounded hover:bg-muted/30 text-muted-foreground transition-colors"
            title={`Sort by ${sortBy === "name" ? "volatility" : "name"}`}
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-7 h-7 text-[11px] bg-muted/20 border-border/15 rounded-lg focus:border-primary/30 focus:shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-px p-1.5 overflow-x-auto scrollbar-none border-b border-border/10">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              "px-2 py-1 text-[9px] font-semibold rounded-md whitespace-nowrap transition-all",
              category === cat.key
                ? "bg-primary/15 text-primary border border-primary/25 shadow-[0_0_6px_hsl(var(--primary)/0.1)]"
                : "text-muted-foreground/70 hover:bg-muted/30 hover:text-muted-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {favorites.size > 0 && category === "all" && !search && (
        <div className="px-2 pt-2 pb-1">
          <p className="text-[9px] text-muted-foreground/70 font-semibold tracking-wider mb-1 px-1">⭐ FAVORITES</p>
          {ASSETS.filter(a => favorites.has(a.symbol)).map(asset => (
            <AssetRow
              key={`fav-${asset.symbol}`}
              asset={asset}
              selected={selectedAsset === asset.symbol}
              isFav
              onSelect={() => onSelectAsset(asset.symbol)}
              onToggleFav={() => toggleFav(asset.symbol)}
            />
          ))}
          <div className="border-b border-border/10 my-1 mx-1" />
        </div>
      )}

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-px scrollbar-thin">
        {filtered.map(asset => (
          <AssetRow
            key={asset.symbol}
            asset={asset}
            selected={selectedAsset === asset.symbol}
            isFav={favorites.has(asset.symbol)}
            onSelect={() => onSelectAsset(asset.symbol)}
            onToggleFav={() => toggleFav(asset.symbol)}
          />
        ))}
      </div>
    </div>
  );
};

const AssetRow = ({ asset, selected, isFav, onSelect, onToggleFav }: {
  asset: Asset; selected: boolean; isFav: boolean;
  onSelect: () => void; onToggleFav: () => void;
}) => (
  <div
    onClick={onSelect}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    className={cn(
      "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all group cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40",
      selected
        ? "bg-primary/10 border border-primary/25 shadow-[0_0_10px_hsl(var(--primary)/0.1)]"
        : "hover:bg-muted/20 border border-transparent"
    )}
  >
    <span className="text-sm shrink-0">{asset.icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold truncate leading-tight">{asset.symbol}</p>
      <p className="text-[9px] text-muted-foreground/60 truncate">{asset.name}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-[10px] font-mono leading-tight">{asset.price}</p>
      <p className={cn("text-[9px] font-mono font-bold", asset.change >= 0 ? "text-accent" : "text-destructive")}>
        {asset.change >= 0 ? "+" : ""}{asset.change}%
      </p>
    </div>
    <button
      type="button"
      aria-label={isFav ? `Unfavorite ${asset.symbol}` : `Favorite ${asset.symbol}`}
      onClick={e => { e.stopPropagation(); onToggleFav(); }}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 ml-0.5 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--gold))] rounded"
    >
      <Star className={cn("w-3 h-3", isFav ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-muted-foreground/40")} />
    </button>
  </div>
);
