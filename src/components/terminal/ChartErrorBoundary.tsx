import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  symbol: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Chart error caught by boundary:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.symbol !== this.props.symbol && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4 p-6">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-foreground">Chart Failed to Load</p>
            <p className="text-[11px] text-muted-foreground max-w-[240px]">
              TradingView encountered an error. This doesn't affect your trades.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Chart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
