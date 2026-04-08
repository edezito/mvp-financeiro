"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { B3PatrimonySummary } from "@/components/b3/B3PatrimonySummary";
import { TopPerformers } from "@/components/b3/TopPerformers";
import { B3AssetTable } from "@/components/b3/B3AssetTable";
import { MacroDataCard } from "@/components/b3/MacroDataCard";
import { LivePriceBar } from "@/components/b3/LivePriceBar";
import { StreakCard } from "@/components/b3/StreakCard";
import { InvestmentGoalsPanel } from "@/components/b3/InvestmentGoals";
import {
  PortfolioAllocationChart,
  AssetGainChart,
  IpcaHistoryChart,
} from "@/components/b3/B3Charts";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Card } from "@/components/ui/Card";
import { useB3Store } from "@/contexts/b3Store";
import { useGamificationStore } from "@/contexts/gamificationStore";
import { cn } from "@/lib/utils";
import { BarChart3, PieChart, TrendingUp, Target, Activity } from "lucide-react";

type Tab = "overview" | "charts" | "macro" | "goals";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Visão geral", icon: BarChart3 },
  { id: "charts", label: "Gráficos", icon: PieChart },
  { id: "macro", label: "Macro", icon: TrendingUp },
  { id: "goals", label: "Metas & Streak", icon: Target },
];

export default function B3Page() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [focusTicker, setFocusTicker] = useState<string | null>(null);

  const { fetchPortfolio, fetchMacro, fetchIpcaHistory, fetchPortfolioDividends, error, clearError } =
    useB3Store();
  const { fetchStreak, fetchGoals, recordActivity } = useGamificationStore();

  useEffect(() => {
    // Carrega tudo em paralelo
    Promise.all([
      fetchPortfolio(),
      fetchMacro(),
      fetchIpcaHistory(12),
      fetchPortfolioDividends(),
      fetchStreak(),
      fetchGoals(),
    ]);
    // Registra visita ao painel — pontua o streak
    recordActivity("portfolio_check");
  }, []);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Monitor B3</h2>
            <p className="text-sm text-gray-500">
              Cotações ao vivo · Rentabilidade real · Banco Central
            </p>
          </div>
        </div>

        {error && <ErrorAlert message={error} onClose={clearError} />}

        {/* Barra de status em tempo real */}
        <LivePriceBar />

        {/* Patrimônio total — sempre visível (divulgação progressiva L1) */}
        <B3PatrimonySummary />

        {/* Top 3 altas/baixas — divulgação progressiva L2 */}
        <Card>
          <p className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-600" aria-hidden />
            Destaques do portfólio
          </p>
          <TopPerformers onAssetClick={(t) => { setFocusTicker(t); setActiveTab("overview"); }} />
        </Card>

        {/* Abas para drill-down — divulgação progressiva L3 */}
        <div>
          <div
            className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1"
            role="tablist"
            aria-label="Seções do monitor B3"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" aria-hidden />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Visão geral — tabela completa */}
          <div
            id="tabpanel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            hidden={activeTab !== "overview"}
          >
            {activeTab === "overview" && (
              <Card>
                <p className="mb-4 text-sm font-semibold text-gray-700">
                  Todos os ativos — clique para detalhes
                </p>
                <B3AssetTable />
              </Card>
            )}
          </div>

          {/* Gráficos */}
          <div
            id="tabpanel-charts"
            role="tabpanel"
            hidden={activeTab !== "charts"}
          >
            {activeTab === "charts" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card><PortfolioAllocationChart /></Card>
                <Card><AssetGainChart /></Card>
                <Card className="lg:col-span-2"><IpcaHistoryChart /></Card>
              </div>
            )}
          </div>

          {/* Macro */}
          <div
            id="tabpanel-macro"
            role="tabpanel"
            hidden={activeTab !== "macro"}
          >
            {activeTab === "macro" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <MacroDataCard />
                <Card>
                  <IpcaHistoryChart />
                </Card>
              </div>
            )}
          </div>

          {/* Metas e Streak */}
          <div
            id="tabpanel-goals"
            role="tabpanel"
            hidden={activeTab !== "goals"}
          >
            {activeTab === "goals" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <StreakCard />
                </div>
                <div className="lg:col-span-2">
                  <InvestmentGoalsPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
