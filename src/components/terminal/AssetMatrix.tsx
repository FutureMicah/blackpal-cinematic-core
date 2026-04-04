import { useState } from "react";
import { Search, Star, TrendingUp, Flame, Droplets, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Asset {
  symbol: string;
  name: string;
  price: string;
  change: number;
  icon: string;
  category: string;
  favorite?: boolean;
}

const ASSETS: Asset[] = [
  { symbol: "BTC/USDT", name: "Bitcoin", price: "67,432.50", change: 2.34, icon: "🟡", category: "crypto" },
  { symbol: "ETH/USDT", name: "Ethereum", price: "3,521.80", change: -0.87, icon: "🔵", category: "crypto" },
  { symbol: "SOL/USDT", name: "Solana", price: "178.45", change: 5.12, icon: "🟣", category: "crypto" },
  { symbol: "PEPE/USDT", name: "Pepe", price: "0.00001234", change: 12.5, icon: "🐸", category: "crypto" },
  { symbol: "DOGE/USDT", name: "Dogecoin", price: "0.1542", change: -1.2, icon: "🐶", category: "crypto" },
  { symbol: "XRP/USDT", name: "Ripple", price: "0.6234", change: 0.45, icon: "⚪", category: "crypto" },
  { symbol: "EUR/USD", name: "Euro/Dollar", price: "1.0876", change: 0.12, icon: "🇪🇺", category: "forex" },
  { symbol: "GBP/JPY", name: "Pound/Yen", price: "198.432", change: -0.34, icon: "🇬🇧", category: "forex" },
  { symbol: "USD/JPY", name: "Dollar/Yen", price: "154.230", change: 0.67, icon: "🇺🇸", category: "forex" },
  { symbol: "GBP/USD", name: "Pound/Dollar", price: "1.2654", change: -0.21, icon: "🇬🇧", category: "forex" },
  { symbol: "XAU/USD", name: "Gold", price: "2,412.50", change: 0.89, icon: "🟡", category: "energy" },
  { symbol: "WTI/USD", name: "Crude Oil", price: "78.34", change: -1.56, icon: "🛢️", category: "energy" },
  { symbol: "US30", name: "Dow Jones", price: "39,872", change: 0.45, icon: "📊", category: "indices" },
  { symbol: "NAS100", name: "Nasdaq", price: "17,654", change: 1.23, icon: "📈", category: "indices" },
];

const CATEGORIES = [
  { key: "all", label: "All", icon: BarChart3 },
  { key: "crypto", label: "Crypto", icon: Flame },
  { key: "forex", label: "Forex", icon: TrendingUp },
  { key: "energy", label: "Commodities", icon: Droplets },
  { key: "indices", label: "Indices", icon: BarChart3 },
];

interface AssetMatrixProps {
  selectedAsset: string;
  onSelectAsset: (symbol: string) => void;
}

export const AssetMatrix = ({ selectedAsset, onSelectAsset }: AssetMatrixProps) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BTC/USDT", "ETH/USDT"]));

  const filtered = ASSETS.filter(a => {
    const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || a.category === category;
    return matchSearch && matchCat;
  });

  const toggleFav = (symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl border-r border-border/30">
      {/* Header */}
      <div className="p-3 border-b border-border/20">
        <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground mb-2">ASSET MATRIX</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-8 h-8 text-xs bg-muted/30 border-border/20 rounded-lg"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-0.5 p-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium rounded-md whitespace-nowrap transition-all",
              category === cat.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-muted/40"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {favorites.size > 0 && category === "all" && (
        <div className="px-3 pb-1">
          <p className="text-[10px] text-muted-foreground font-semibold tracking-wider mb-1">⭐ FAVORITES</p>
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
          <div className="border-b border-border/10 my-1" />
        </div>
      )}

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
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
  <button
    onClick={onSelect}
    className={cn(
      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group",
      selected
        ? "bg-primary/10 border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
        : "hover:bg-muted/30 border border-transparent"
    )}
  >
    <span className="text-sm">{asset.icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold truncate">{asset.symbol}</p>
      <p className="text-[10px] text-muted-foreground truncate">{asset.name}</p>
    </div>
    <div className="text-right">
      <p className="text-xs font-mono">{asset.price}</p>
      <p className={cn("text-[10px] font-mono", asset.change >= 0 ? "text-accent" : "text-destructive")}>
        {asset.change >= 0 ? "+" : ""}{asset.change}%
      </p>
    </div>
    <button
      onClick={e => { e.stopPropagation(); onToggleFav(); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Star className={cn("w-3 h-3", isFav ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-muted-foreground")} />
    </button>
  </button>
);
