"use client";

import { useB3Store } from "@/contexts/b3Store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { EnrichedAsset } from "@/lib/types";

interface AssetPillProps {
  asset: EnrichedAsset;
  onClick?: () => void;
}

function AssetPill({ asset, onClick }: AssetPillProps) {
  const pos = asset.is_positive;
  return (
    <button
      onClick={onClick}
      aria-label={`${asset.ticker}: ${asset.gain_pct.toFixed(2)}%`}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition",
        pos
          ? "bg-green-50 hover:bg-green-100 border border-green-100"
          : "bg-red-50 hover:bg-red-100 border border-red-100"
      )}
    >
      <div className="flex items-center gap-2.5">
        {pos ? (
          <TrendingUp className="h-4 w-4 flex-shrink-0 text-green-600" aria-hidden />
        ) : (
          <TrendingDown className="h-4 w-4 flex-shrink-0 text-red-600" aria-hidden />
        )}
        <div>
          <p className={cn("text-sm font-bold", pos ? "text-green-800" : "text-red-800")}>
            {asset.ticker}
          </p>
          <p className="max-w-[140px] truncate text-xs text-gray-500">{asset.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", pos ? "text-green-700" : "text-red-700")}>
          {pos ? "+" : ""}
          {asset.gain_pct.toFixed(2)}%
        </p>
        <p className={cn("text-xs", pos ? "text-green-600" : "text-red-600")}>
          {pos ? "+" : ""}
          {formatCurrency(asset.gain_nominal)}
        </p>
      </div>
    </button>
  );
}

interface Props {
  onAssetClick?: (ticker: string) => void;
}

export function TopPerformers({ onAssetClick }: Props) {
  const { portfolio, loading } = useB3Store();
  const { top_winners = [], top_losers = [] } = portfolio?.ranking ?? {};

  if (loading && !portfolio) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!top_winners.length && !top_losers.length) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2" role="region" aria-label="Top desempenho">
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-700">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden /> Maiores altas
        </p>
        {top_winners.map((a) => (
          <AssetPill key={a.ticker} asset={a} onClick={() => onAssetClick?.(a.ticker)} />
        ))}
      </div>
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
          <TrendingDown className="h-3.5 w-3.5" aria-hidden /> Maiores baixas
        </p>
        {top_losers.map((a) => (
          <AssetPill key={a.ticker} asset={a} onClick={() => onAssetClick?.(a.ticker)} />
        ))}
      </div>
    </div>
  );
}
