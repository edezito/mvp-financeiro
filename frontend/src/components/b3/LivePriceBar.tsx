"use client";

import { useEffect, useState } from "react";
import { useB3Store } from "@/contexts/b3Store";
import { useGamificationStore } from "@/contexts/gamificationStore";
import { cn } from "@/lib/utils";
import { RefreshCw, Clock, Wifi } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LivePriceBar() {
  const { portfolio, loading, fetchPortfolio, lastUpdated } = useB3Store();
  const { recordActivity } = useGamificationStore();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    await fetchPortfolio();
    await recordActivity("portfolio_check");
  };

  const cachedCount =
    portfolio?.assets.filter((a) => a.quote_available).length ?? 0;
  const totalCount = portfolio?.assets.length ?? 0;

  const freshness =
    secondsAgo < 60
      ? { label: `${secondsAgo}s atrás`, color: "text-green-600" }
      : secondsAgo < 300
      ? { label: `${Math.floor(secondsAgo / 60)}min atrás`, color: "text-yellow-600" }
      : { label: "desatualizado", color: "text-red-500" };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Status de atualização dos preços"
    >
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5 text-green-500" aria-hidden />
          <span>
            {cachedCount}/{totalCount} cotações carregadas
          </span>
        </span>
        {lastUpdated && (
          <span className={cn("flex items-center gap-1", freshness.color)}>
            <Clock className="h-3 w-3" aria-hidden />
            {freshness.label}
          </span>
        )}
      </div>

      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        onClick={handleRefresh}
        aria-label="Atualizar cotações"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Atualizar preços
      </Button>
    </div>
  );
}