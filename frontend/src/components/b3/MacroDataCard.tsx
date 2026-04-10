"use client";

import { useB3Store } from "@/contexts/b3Store";
import { Landmark, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function MacroDataCard() {
  const { macro, loadingMacro, fetchMacro } = useB3Store();

  const rows = [
    {
      label: "Taxa Selic (a.a.)",
      value: macro ? `${macro.selic_aa.toFixed(2)}%` : "—",
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "IPCA acumulado 12m",
      value: macro ? `${macro.ipca_12m.toFixed(2)}%` : "—",
      color: "text-orange-700",
      bg: "bg-orange-50",
    },
    {
      label: "IPCA último mês",
      value: macro ? `${macro.ipca_mes.toFixed(2)}%` : "—",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Selic real (Fisher)",
      value: macro ? `${macro.real_yield_fisher.toFixed(2)}%` : "—",
      color:
        macro && macro.real_yield_fisher >= 0
          ? "text-green-700"
          : "text-red-700",
      bg:
        macro && macro.real_yield_fisher >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-blue-600" aria-hidden />
          <span className="text-sm font-semibold text-gray-700">
            Dados Macroeconômicos
          </span>
        </div>
        <div className="flex items-center gap-2">
          {macro?.cached && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              cache
            </span>
          )}
          <button
            onClick={fetchMacro}
            disabled={loadingMacro}
            aria-label="Atualizar dados macro"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loadingMacro && "animate-spin")}
            />
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        Fonte: SGS Banco Central do Brasil · Equação de Fisher para retorno real
      </p>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{r.label}</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                r.bg,
                r.color
              )}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <strong>Equação de Fisher:</strong> r_real = ((1 + r_nominal) / (1 +
        IPCA)) − 1
      </div>
    </div>
  );
}