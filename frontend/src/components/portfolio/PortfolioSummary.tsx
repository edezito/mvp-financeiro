"use client";

import { usePortfolioStore } from "@/contexts/portfolioStore";
import { StatCard } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { BriefcaseBusiness, Layers } from "lucide-react";

export function PortfolioSummary() {
  const { totalInvested, assetCount } = usePortfolioStore();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        title="Total Investido"
        value={formatCurrency(totalInvested)}
        icon={BriefcaseBusiness}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
        subtitle="soma de todos os ativos"
      />
      <StatCard
        title="Ativos na Carteira"
        value={String(assetCount)}
        icon={Layers}
        iconColor="text-orange-600"
        iconBg="bg-orange-50"
        subtitle="tickers distintos"
      />
    </div>
  );
}
