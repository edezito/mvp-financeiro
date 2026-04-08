"use client";

import { useB3Store } from "@/contexts/b3Store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2, Percent, Landmark,
} from "lucide-react";

export function B3PatrimonySummary() {
  const { portfolio, macro } = useB3Store();
  const s = portfolio?.summary;

  const cards = [
    {
      label: "Patrimônio Total",
      value: formatCurrency(s?.total_current_value ?? 0),
      sub: `Investido: ${formatCurrency(s?.total_invested ?? 0)}`,
      icon: DollarSign,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      trend: null,
    },
    {
      label: "Resultado Nominal",
      value: formatCurrency(s?.total_gain_nominal ?? 0),
      sub: `${s?.total_gain_pct?.toFixed(2) ?? "0.00"}% sobre custo`,
      icon: s?.is_positive ? TrendingUp : TrendingDown,
      iconBg: s?.is_positive ? "bg-green-50" : "bg-red-50",
      iconColor: s?.is_positive ? "text-green-600" : "text-red-600",
      trend: s?.is_positive ? "up" : "down",
    },
    {
      label: "Retorno Real (Fisher)",
      value: `${s?.total_real_pct?.toFixed(2) ?? "0.00"}%`,
      sub: `IPCA 12m: ${macro?.ipca_12m?.toFixed(2) ?? "—"}%`,
      icon: Percent,
      iconBg: (s?.total_real_pct ?? 0) >= 0 ? "bg-emerald-50" : "bg-orange-50",
      iconColor: (s?.total_real_pct ?? 0) >= 0 ? "text-emerald-600" : "text-orange-600",
      trend: (s?.total_real_pct ?? 0) >= 0 ? "up" : "down",
    },
    {
      label: "Selic / IPCA",
      value: `${macro?.selic_aa?.toFixed(2) ?? "—"}%`,
      sub: `IPCA: ${macro?.ipca_12m?.toFixed(2) ?? "—"}% | Real: ${macro?.real_yield_fisher?.toFixed(2) ?? "—"}%`,
      icon: Landmark,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {c.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-2xl font-bold truncate",
                  c.trend === "up" && "text-green-600",
                  c.trend === "down" && "text-red-600",
                  !c.trend && "text-gray-900"
                )}
              >
                {s === undefined ? (
                  <span className="inline-block h-7 w-28 animate-pulse rounded bg-gray-100" />
                ) : (
                  c.value
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-400">{c.sub}</p>
            </div>
            <div className={cn("ml-3 flex-shrink-0 rounded-lg p-2.5", c.iconBg)}>
              <c.icon className={cn("h-5 w-5", c.iconColor)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
